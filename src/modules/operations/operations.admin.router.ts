import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketIdsForScope } from '../../shared/scope';
import { badRequest, notFound } from '../../shared/errors';
import { finalPrice, withPricing } from '../../shared/pricing';
import { visibleProductWhere } from '../stalls/stalls.service';
import { genOrderCode } from '../../shared/order-code';
import { notifyUsers } from '../../shared/notification.helper';
import { createMockPayment, simulatePublicOrderPayment } from '../payments/mock-payment.service';
import { ensureOperationsSchema } from './operations.schema';

export const operationsAdminRouter = Router();
const idParam = z.object({ id: z.string().uuid() });
const range = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional(), marketId: z.string().uuid().optional() });

operationsAdminRouter.use(async (_req, _res, next) => { try { await ensureOperationsSchema(); next(); } catch (e) { next(e); } });

async function ids(req: any, marketId?: string) {
  if (marketId) { await assertMarketInScope(req.scope, marketId); return [marketId]; }
  return marketIdsForScope(req.scope!);
}
function sqlMarket(marketIds: string[] | null, column = 'market_id') {
  return marketIds ? Prisma.sql`AND ${Prisma.raw(column)} = ANY(${marketIds}::uuid[])` : Prisma.empty;
}

// ===== Billing / debt ledger =====
operationsAdminRouter.get('/billing/summary', validate({ query: range }), async (req, res, next) => {
  try {
    const q = req.query as any; const marketIds = await ids(req, q.marketId);
    const m = sqlMarket(marketIds);
    const [summary, byMarket, overdue] = await Promise.all([
      prisma.$queryRaw<any[]>`SELECT COUNT(*)::int AS invoice_count, COALESCE(SUM(amount),0)::float AS billed, COALESCE(SUM(paid_amount),0)::float AS paid, COALESCE(SUM(amount-paid_amount),0)::float AS debt, COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND amount > paid_amount)::int AS overdue FROM fee_invoices WHERE 1=1 ${m}`,
      prisma.$queryRaw<any[]>`SELECT fi.market_id, ma.name AS market_name, COALESCE(SUM(fi.amount),0)::float billed, COALESCE(SUM(fi.paid_amount),0)::float paid, COUNT(*)::int invoices FROM fee_invoices fi JOIN markets ma ON ma.id=fi.market_id WHERE 1=1 ${m} GROUP BY fi.market_id,ma.name ORDER BY billed DESC`,
      prisma.$queryRaw<any[]>`SELECT fi.id,fi.code,fi.amount,fi.paid_amount,fi.due_date,s.code stall_code,ma.name market_name FROM fee_invoices fi JOIN stalls s ON s.id=fi.stall_id JOIN markets ma ON ma.id=fi.market_id WHERE fi.due_date < CURRENT_DATE AND fi.amount > fi.paid_amount ${m} ORDER BY fi.due_date ASC LIMIT 10`,
    ]);
    ok(res, { summary: summary[0] ?? {}, by_market: byMarket, overdue });
  } catch (e) { next(e); }
});

operationsAdminRouter.get('/billing/invoices', validate({ query: range.extend({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), status: z.enum(['unpaid', 'partial', 'paid', 'cancelled']).optional() }) }), async (req, res, next) => {
  try {
    const q = req.query as any; const marketIds = await ids(req, q.marketId); const m = sqlMarket(marketIds);
    const status = q.status ? Prisma.sql`AND fi.status=${q.status}` : Prisma.empty;
    const rows = await prisma.$queryRaw<any[]>`SELECT fi.*,ma.name market_name,s.code stall_code,s.name stall_name,u.full_name merchant_name FROM fee_invoices fi JOIN markets ma ON ma.id=fi.market_id JOIN stalls s ON s.id=fi.stall_id LEFT JOIN contracts c ON c.id=fi.contract_id LEFT JOIN users u ON u.id=c.merchant_id WHERE 1=1 ${m} ${status} ORDER BY fi.due_date DESC,fi.created_at DESC LIMIT ${q.limit} OFFSET ${(q.page-1)*q.limit}`;
    const total = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint count FROM fee_invoices fi WHERE 1=1 ${m} ${status}`;
    paginated(res, rows, { page: q.page, limit: q.limit, total: Number(total[0]?.count ?? 0) });
  } catch (e) { next(e); }
});

operationsAdminRouter.post('/billing/cycles/generate', requireRoles('super_admin', 'market_manager'), validate({ body: z.object({ marketId: z.string().uuid(), periodStart: z.coerce.date(), periodEnd: z.coerce.date(), dueDate: z.coerce.date(), name: z.string().trim().min(1).max(255) }) }), async (req, res, next) => {
  try {
    await assertMarketInScope(req.scope!, req.body.marketId);
    const b = req.body; const code = `FEE-${b.periodStart.toISOString().slice(0,7)}-${b.marketId.slice(0,8)}`;
    const cycle = await prisma.$queryRaw<any[]>`INSERT INTO fee_cycles(id,market_id,code,name,period_start,period_end,due_date,status,created_by) VALUES (${randomUUID()}::uuid,${b.marketId}::uuid,${code},${b.name},${b.periodStart},${b.periodEnd},${b.dueDate},'issued',${req.user!.id}::uuid) ON CONFLICT (market_id,code) DO UPDATE SET name=EXCLUDED.name,due_date=EXCLUDED.due_date RETURNING *`;
    const cycleId = cycle[0].id;
    await prisma.$executeRaw`INSERT INTO fee_invoices(id,cycle_id,market_id,stall_id,contract_id,code,description,amount,due_date,created_by) SELECT gen_random_uuid(),${cycleId}::uuid,s.market_id,c.stall_id,c.id,${`INV-${b.periodStart.toISOString().slice(0,7)}-`}||s.code,'Phí thuê sạp',c.fee,${b.dueDate},${req.user!.id}::uuid FROM contracts c JOIN stalls s ON s.id=c.stall_id WHERE c.ended_at IS NULL AND s.market_id=${b.marketId}::uuid AND c.start_date <= ${b.periodEnd} AND (c.end_date IS NULL OR c.end_date >= ${b.periodStart}) ON CONFLICT (code) DO NOTHING`;
    ok(res, cycle[0], 201);
  } catch (e) { next(e); }
});

operationsAdminRouter.post('/billing/invoices/:id/payments', requireRoles('super_admin', 'market_manager'), validate({ params: idParam, body: z.object({ amount: z.coerce.number().positive(), method: z.enum(['cash', 'bank_transfer', 'qr_manual']).default('cash'), referenceCode: z.string().max(120).optional(), proofUrl: z.string().url().optional(), note: z.string().max(1000).optional() }) }), async (req, res, next) => {
  try {
    const invoice = await prisma.$queryRaw<any[]>`SELECT * FROM fee_invoices WHERE id=${req.params.id}::uuid FOR UPDATE`;
    if (!invoice[0]) throw notFound('Không tìm thấy khoản phải thu');
    if (Number(req.body.amount) > Number(invoice[0].amount) - Number(invoice[0].paid_amount)) throw badRequest('Số tiền thu vượt số còn nợ');
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO fee_payments(invoice_id,amount,method,reference_code,proof_url,note,received_by) VALUES (${req.params.id}::uuid,${req.body.amount},${req.body.method},${req.body.referenceCode ?? null},${req.body.proofUrl ?? null},${req.body.note ?? null},${req.user!.id}::uuid)`;
      return tx.$queryRaw<any[]>`UPDATE fee_invoices SET paid_amount=paid_amount+${req.body.amount},status=CASE WHEN paid_amount+${req.body.amount} >= amount THEN 'paid' WHEN paid_amount+${req.body.amount}>0 THEN 'partial' ELSE status END,updated_at=now() WHERE id=${req.params.id}::uuid RETURNING *`;
    });
    ok(res, result[0]);
  } catch (e) { next(e); }
});

// ===== Manual QR payment reconciliation =====
// This deliberately records a payment intent/receipt only. It never calls a bank or wallet provider.
operationsAdminRouter.get('/payments', requireRoles('super_admin', 'province_admin', 'market_manager'), validate({ query: range.extend({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), status: z.enum(['pending', 'paid', 'failed', 'expired', 'refunded', 'confirmed', 'rejected']).optional() }) }), async (req, res, next) => {
  try {
    const q = req.query as any; const marketIds = await ids(req, q.marketId);
    const m = sqlMarket(marketIds); const status = q.status ? Prisma.sql`AND pt.status=${q.status}` : Prisma.empty;
    const rows = await prisma.$queryRaw<any[]>`SELECT pt.*,ma.name market_name,s.code stall_code,o.code order_code FROM payment_transactions pt JOIN markets ma ON ma.id=pt.market_id LEFT JOIN stalls s ON s.id=pt.stall_id LEFT JOIN orders o ON o.id=pt.order_id WHERE 1=1 ${m} ${status} ORDER BY pt.created_at DESC LIMIT ${q.limit} OFFSET ${(q.page-1)*q.limit}`;
    const total = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint count FROM payment_transactions pt WHERE 1=1 ${m} ${status}`;
    paginated(res, rows, { page: q.page, limit: q.limit, total: Number(total[0]?.count ?? 0) });
  } catch (e) { next(e); }
});

operationsAdminRouter.post('/payments', requireRoles('super_admin', 'province_admin', 'market_manager'), validate({ body: z.object({ marketId: z.string().uuid(), stallId: z.string().uuid().optional(), orderId: z.string().uuid().optional(), amount: z.coerce.number().positive(), method: z.enum(['qr_manual', 'cash', 'bank_transfer']).default('qr_manual'), referenceCode: z.string().max(120).optional(), proofUrl: z.string().url().optional(), note: z.string().max(1000).optional() }) }), async (req, res, next) => {
  try {
    await assertMarketInScope(req.scope!, req.body.marketId);
    const b = req.body; const code = `PAY-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const row = await prisma.$queryRaw<any[]>`INSERT INTO payment_transactions(market_id,stall_id,order_id,code,amount,method,reference_code,proof_url,note) VALUES (${b.marketId}::uuid,${b.stallId ?? null}::uuid,${b.orderId ?? null}::uuid,${code},${b.amount},${b.method},${b.referenceCode ?? null},${b.proofUrl ?? null},${b.note ?? null}) RETURNING *`;
    ok(res, row[0], 201);
  } catch (e) { next(e); }
});

operationsAdminRouter.patch('/payments/:id', requireRoles('super_admin', 'province_admin', 'market_manager'), validate({ params: idParam, body: z.object({ status: z.enum(['confirmed', 'rejected']), note: z.string().max(1000).optional() }) }), async (req, res, next) => {
  try {
    const current = await prisma.$queryRaw<any[]>`SELECT market_id FROM payment_transactions WHERE id=${req.params.id}::uuid`;
    if (!current[0]) throw notFound('Không tìm thấy giao dịch');
    await assertMarketInScope(req.scope!, current[0].market_id);
    const row = await prisma.$queryRaw<any[]>`UPDATE payment_transactions SET status=${req.body.status},note=COALESCE(${req.body.note ?? null},note),confirmed_by=${req.user!.id}::uuid,confirmed_at=now(),updated_at=now() WHERE id=${req.params.id}::uuid RETURNING *`;
    ok(res, row[0]);
  } catch (e) { next(e); }
});

// ===== Static table QR for dine-in ordering =====
operationsAdminRouter.get('/table-qrs', requireRoles('super_admin', 'province_admin', 'market_manager'), validate({ query: range.extend({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(50), stallId: z.string().uuid().optional() }) }), async (req, res, next) => {
  try {
    const q = req.query as any;
    const marketIds = await ids(req, q.marketId);
    const m = sqlMarket(marketIds);
    const stall = q.stallId ? Prisma.sql`AND mt.stall_id=${q.stallId}::uuid` : Prisma.empty;
    const rows = await prisma.$queryRaw<any[]>`SELECT mt.*,ma.name market_name,s.code stall_code,s.name stall_name FROM market_tables mt JOIN markets ma ON ma.id=mt.market_id JOIN stalls s ON s.id=mt.stall_id WHERE 1=1 ${m} ${stall} ORDER BY mt.created_at DESC LIMIT ${q.limit} OFFSET ${(q.page-1)*q.limit}`;
    const total = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint count FROM market_tables mt WHERE 1=1 ${m}`;
    paginated(res, rows.map((row) => ({ ...row, public_url: `/table/${row.qr_token}` })), { page: q.page, limit: q.limit, total: Number(total[0]?.count ?? 0) });
  } catch (e) { next(e); }
});

operationsAdminRouter.post('/table-qrs', requireRoles('super_admin', 'market_manager'), validate({ body: z.object({ marketId: z.string().uuid(), stallId: z.string().uuid(), code: z.string().trim().min(1).max(40), name: z.string().trim().max(120).optional() }) }), async (req, res, next) => {
  try {
    await assertMarketInScope(req.scope!, req.body.marketId);
    const stall = await prisma.stalls.findUnique({ where: { id: req.body.stallId }, select: { market_id: true } });
    if (!stall || stall.market_id !== req.body.marketId) throw badRequest('Sạp không thuộc chợ đã chọn');
    const token = `table-${randomUUID().replace(/-/g, '')}`;
    const rows = await prisma.$queryRaw<any[]>`INSERT INTO market_tables(market_id,stall_id,code,name,qr_token,created_by) VALUES (${req.body.marketId}::uuid,${req.body.stallId}::uuid,${req.body.code},${req.body.name ?? `Bàn ${req.body.code}`},${token},${req.user!.id}::uuid) RETURNING *`;
    ok(res, { ...rows[0], public_url: `/table/${token}` }, 201);
  } catch (e) { next(e); }
});

operationsAdminRouter.patch('/table-qrs/:id', requireRoles('super_admin', 'market_manager'), validate({ params: idParam, body: z.object({ status: z.enum(['active', 'inactive']), name: z.string().trim().max(120).optional() }) }), async (req, res, next) => {
  try {
    const current = await prisma.$queryRaw<any[]>`SELECT market_id FROM market_tables WHERE id=${req.params.id}::uuid`;
    if (!current[0]) throw notFound('Không tìm thấy bàn');
    await assertMarketInScope(req.scope!, current[0].market_id);
    const rows = await prisma.$queryRaw<any[]>`UPDATE market_tables SET status=${req.body.status},name=COALESCE(${req.body.name ?? null},name),updated_at=now() WHERE id=${req.params.id}::uuid RETURNING *`;
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

// ===== Complaint SLA / assignment / timeline =====
operationsAdminRouter.get('/complaints/metrics', validate({ query: range.extend({ marketId: z.string().uuid().optional() }) }), async (req, res, next) => {
  try { const marketIds = await ids(req, (req.query as any).marketId); const m=sqlMarket(marketIds); const rows=await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE due_at<CURRENT_TIMESTAMP AND status NOT IN ('resolved','rejected'))::int overdue,COUNT(*) FILTER(WHERE due_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP+interval '48 hours' AND status NOT IN ('resolved','rejected'))::int due_soon,COUNT(*) FILTER(WHERE public_result=true)::int public_count FROM complaints WHERE due_at IS NOT NULL ${m}`; ok(res,rows[0]??{}); } catch(e){next(e);} });
operationsAdminRouter.patch('/complaints/:id/assignment', requireRoles('super_admin','province_admin','market_manager'), validate({ params:idParam, body:z.object({ assignedTo:z.string().uuid().nullable().optional(), priority:z.enum(['low','normal','high','urgent']).optional(), dueAt:z.coerce.date().nullable().optional() }) }), async(req,res,next)=>{try{const c=await prisma.complaints.findUnique({where:{id:req.params.id},select:{market_id:true,status:true}});if(!c)throw notFound('Không tìm thấy phản ánh');await assertMarketInScope(req.scope!,c.market_id);const b=req.body;const row=await prisma.$queryRaw<any[]>`UPDATE complaints SET assigned_to=${b.assignedTo??null}::uuid,priority=COALESCE(${b.priority??null},priority),due_at=${b.dueAt??null},updated_at=now() WHERE id=${req.params.id}::uuid RETURNING *`;await prisma.$executeRaw`INSERT INTO complaint_timelines(complaint_id,actor_id,action,note) VALUES (${req.params.id}::uuid,${req.user!.id}::uuid,'assignment',${b.assignedTo?'Đã phân công người xử lý':'Đã bỏ phân công'})`;ok(res,row[0]);}catch(e){next(e);}});
operationsAdminRouter.post('/complaints/:id/timeline', requireRoles('super_admin','province_admin','market_manager'), validate({params:idParam,body:z.object({action:z.string().trim().min(1).max(60),note:z.string().max(2000).optional(),isPublic:z.boolean().default(false)})}),async(req,res,next)=>{try{const c=await prisma.complaints.findUnique({where:{id:req.params.id},select:{market_id:true}});if(!c)throw notFound('Không tìm thấy phản ánh');await assertMarketInScope(req.scope!,c.market_id);const r=await prisma.$queryRaw<any[]>`INSERT INTO complaint_timelines(complaint_id,actor_id,action,note,is_public) VALUES (${req.params.id}::uuid,${req.user!.id}::uuid,${req.body.action},${req.body.note??null},${req.body.isPublic}) RETURNING *`;ok(res,r[0],201);}catch(e){next(e);}});

// ===== Merchant verification profile =====
operationsAdminRouter.get('/merchant-profiles/summary', validate({ query: range }), async (req, res, next) => { try { const marketIds = await ids(req, (req.query as any).marketId); const m = marketIds ? Prisma.sql`AND s.market_id=ANY(${marketIds}::uuid[])` : Prisma.empty; const r = await prisma.$queryRaw<any[]>`SELECT COUNT(DISTINCT u.id)::int total_profiles,COUNT(DISTINCT u.id) FILTER (WHERE u.verification_status='verified')::int verified,COUNT(DISTINCT u.id) FILTER (WHERE u.verification_status='need_more_info')::int needs_more_info,COUNT(DISTINCT u.id) FILTER (WHERE NULLIF(u.tax_code,'') IS NOT NULL)::int with_tax_code FROM users u JOIN contracts c ON c.merchant_id=u.id AND c.ended_at IS NULL JOIN stalls s ON s.id=c.stall_id WHERE 1=1 ${m}`; ok(res, r[0] ?? {}); } catch (e) { next(e); } });
operationsAdminRouter.get('/merchant-profiles/:id', validate({params:idParam}), async(req,res,next)=>{try{const u=await prisma.$queryRaw<any[]>`SELECT id,full_name,phone,email,citizen_id,tax_code,identity_issued_at,identity_expires_at,verification_status,verification_note,profile_documents,merchant_market_id,merchant_mode FROM users WHERE id=${req.params.id}::uuid LIMIT 1`;if(!u[0])throw notFound('Không tìm thấy hồ sơ');if(u[0].merchant_market_id)await assertMarketInScope(req.scope!,u[0].merchant_market_id);ok(res,u[0]);}catch(e){next(e);}});
operationsAdminRouter.patch('/merchant-profiles/:id/mode', requireRoles('super_admin','province_admin','market_manager'), validate({params:idParam,body:z.object({mode:z.enum(['simple','pos'])})}), async(req,res,next)=>{try{const u=await prisma.$queryRaw<any[]>`SELECT id,merchant_market_id FROM users WHERE id=${req.params.id}::uuid LIMIT 1`;if(!u[0])throw notFound('Không tìm thấy tiểu thương');if(u[0].merchant_market_id)await assertMarketInScope(req.scope!,u[0].merchant_market_id);const r=await prisma.$queryRaw<any[]>`UPDATE users SET merchant_mode=${req.body.mode},updated_at=now() WHERE id=${req.params.id}::uuid RETURNING id,full_name,merchant_mode`;ok(res,r[0]);}catch(e){next(e);}});
operationsAdminRouter.patch('/merchant-profiles/:id', requireRoles('super_admin','province_admin','market_manager'), validate({params:idParam,body:z.object({citizenId:z.string().max(30).optional(),taxCode:z.string().max(30).optional(),identityIssuedAt:z.coerce.date().nullable().optional(),identityExpiresAt:z.coerce.date().nullable().optional(),verificationStatus:z.enum(['unverified','pending','verified','need_more_info','rejected']).optional(),verificationNote:z.string().max(2000).optional(),profileDocuments:z.array(z.record(z.unknown())).optional()})}),async(req,res,next)=>{try{const b=req.body;const row=await prisma.$queryRaw<any[]>`UPDATE users SET citizen_id=COALESCE(${b.citizenId??null},citizen_id),tax_code=COALESCE(${b.taxCode??null},tax_code),identity_issued_at=COALESCE(${b.identityIssuedAt??null},identity_issued_at),identity_expires_at=COALESCE(${b.identityExpiresAt??null},identity_expires_at),verification_status=COALESCE(${b.verificationStatus??null},verification_status),verification_note=COALESCE(${b.verificationNote??null},verification_note),profile_documents=COALESCE(${b.profileDocuments??null}::jsonb,profile_documents),updated_at=now() WHERE id=${req.params.id}::uuid RETURNING id,full_name,citizen_id,tax_code,identity_issued_at,identity_expires_at,verification_status,verification_note,profile_documents`;if(!row[0])throw notFound('Không tìm thấy hồ sơ');ok(res,row[0]);}catch(e){next(e);}});

// ===== Traceability QR / public lookup =====
operationsAdminRouter.post('/traceability/qr', requireRoles('super_admin','province_admin','market_manager'), validate({body:z.object({productId:z.string().uuid().optional(),stallId:z.string().uuid().optional(),label:z.string().max(255).optional()}).refine((v)=>!!v.productId!==!!v.stallId,{message:'Chọn productId hoặc stallId'})}),async(req,res,next)=>{try{const b=req.body;const token=`sm-${randomUUID().replace(/-/g,'')}`;const r=await prisma.$queryRaw<any[]>`INSERT INTO product_qr_codes(public_token,product_id,stall_id,label,created_by) VALUES(${token},${b.productId??null}::uuid,${b.stallId??null}::uuid,${b.label??null},${req.user!.id}::uuid) RETURNING *`;ok(res,{...r[0],public_url:`/trace/${token}`},201);}catch(e){next(e);}});
operationsAdminRouter.get('/traceability/summary', validate({query:range}),async(req,res,next)=>{try{const marketIds=await ids(req,(req.query as any).marketId);const m=marketIds?Prisma.sql`AND s.market_id=ANY(${marketIds}::uuid[])`:Prisma.empty;const r=await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int qr_count,COALESCE(SUM(q.scan_count),0)::int scans,COUNT(*) FILTER(WHERE p.id IS NOT NULL AND pt.id IS NOT NULL)::int covered,COUNT(*) FILTER(WHERE p.id IS NOT NULL AND pt.id IS NULL)::int missing FROM product_qr_codes q LEFT JOIN products p ON p.id=q.product_id LEFT JOIN product_traceability pt ON pt.product_id=p.id LEFT JOIN stalls s ON s.id=COALESCE(q.stall_id,p.stall_id) WHERE 1=1 ${m}`;ok(res,r[0]??{});}catch(e){next(e);}});
operationsAdminRouter.get('/reviews', validate({query:range.extend({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(20),status:z.string().optional()})}),async(req,res,next)=>{try{const q=req.query as any;const marketIds=await ids(req,q.marketId);const m=marketIds?Prisma.sql`AND s.market_id=ANY(${marketIds}::uuid[])`:Prisma.empty;const st=q.status?Prisma.sql`AND r.moderation_status=${q.status}`:Prisma.empty;const rows=await prisma.$queryRaw<any[]>`SELECT r.*,p.name product_name,s.code stall_code,ma.name market_name,u.full_name reviewer_name FROM reviews r JOIN products p ON p.id=r.product_id JOIN stalls s ON s.id=p.stall_id JOIN markets ma ON ma.id=s.market_id JOIN users u ON u.id=r.user_id WHERE 1=1 ${m} ${st} ORDER BY r.created_at DESC LIMIT ${q.limit} OFFSET ${(q.page-1)*q.limit}`;const total=await prisma.$queryRaw<{count:bigint}[]>`SELECT COUNT(*)::bigint count FROM reviews r JOIN products p ON p.id=r.product_id JOIN stalls s ON s.id=p.stall_id WHERE 1=1 ${m} ${st}`;paginated(res,rows,{page:q.page,limit:q.limit,total:Number(total[0]?.count??0)});}catch(e){next(e);}});
operationsAdminRouter.patch('/reviews/:id/moderation', requireRoles('super_admin','province_admin','market_manager'), validate({params:idParam,body:z.object({status:z.enum(['visible','hidden','pending']),note:z.string().max(1000).optional()})}),async(req,res,next)=>{try{const r=await prisma.$queryRaw<any[]>`UPDATE reviews SET moderation_status=${req.body.status},moderation_note=${req.body.note??null},moderated_by=${req.user!.id}::uuid,moderated_at=now(),updated_at=now() WHERE id=${req.params.id}::uuid RETURNING *`;if(!r[0])throw notFound('Không tìm thấy đánh giá');ok(res,r[0]);}catch(e){next(e);}});

// Public QR lookup; deliberately redacts merchant PII.
export const traceabilityPublicRouter = Router();
traceabilityPublicRouter.get('/:token', async(req,res,next)=>{try{await ensureOperationsSchema();const r=await prisma.$queryRaw<any[]>`SELECT q.id,q.public_token,q.scan_count,p.id product_id,p.name product_name,p.origin,p.unit,p.images,pt.producer_name,pt.production_address,pt.batch_code,pt.production_date,pt.harvest_date,pt.expiry_date,pt.certificate_name,pt.certificate_number,pt.documents,s.id stall_id,s.code stall_code,ma.name market_name FROM product_qr_codes q LEFT JOIN products p ON p.id=q.product_id LEFT JOIN product_traceability pt ON pt.product_id=p.id LEFT JOIN stalls s ON s.id=COALESCE(q.stall_id,p.stall_id) LEFT JOIN markets ma ON ma.id=s.market_id WHERE q.public_token=${req.params.token} AND q.is_active=true LIMIT 1`;if(!r[0])throw notFound('Mã truy xuất không tồn tại hoặc đã bị thu hồi');await prisma.$transaction([prisma.$executeRaw`UPDATE product_qr_codes SET scan_count=scan_count+1,last_scanned_at=now() WHERE id=${r[0].id}::uuid`,prisma.$executeRaw`INSERT INTO traceability_scan_events(qr_id,user_agent) VALUES(${r[0].id}::uuid,${String(req.headers['user-agent']??'').slice(0,1000)})`]);const {id,...safe}=r[0];ok(res,safe);}catch(e){next(e);}});

// Public table menu: QR tĩnh mở được từ camera, không cần đăng nhập.
export const tableQrPublicRouter = Router();
tableQrPublicRouter.get('/:token', async (req, res, next) => {
  try {
    await ensureOperationsSchema();
    const rows = await prisma.$queryRaw<any[]>`
      SELECT mt.id, mt.code, mt.name, mt.qr_token, mt.market_id, mt.stall_id,
             ma.name market_name, ma.address market_address, s.code stall_code, s.name stall_name
      FROM market_tables mt
      JOIN markets ma ON ma.id=mt.market_id
      JOIN stalls s ON s.id=mt.stall_id
      WHERE mt.qr_token=${req.params.token} AND mt.status='active'
        AND ma.status='active' AND s.status='occupied'
      LIMIT 1
    `;
    const table = rows[0];
    if (!table) throw notFound('Mã bàn không tồn tại hoặc đã ngừng hoạt động');
    const products = await prisma.products.findMany({
      where: visibleProductWhere({
        stall_id: table.stall_id,
        stalls: { market_id: table.market_id, status: 'occupied', markets: { status: 'active' } },
      }),
      orderBy: { created_at: 'desc' },
      include: { categories: { select: { id: true, name: true, parent_id: true } } },
    });
    const now = new Date();
    const menu = products.map((product) => ({ ...withPricing(product as any, now), category: product.categories }));
    ok(res, { table: { ...table, public_url: `/table/${table.qr_token}` }, products: menu });
  } catch (e) { next(e); }
});

// Guest table checkout: customer can order from the static QR without an account.
tableQrPublicRouter.post('/:token/orders', validate({
  body: z.object({
    receiverName: z.string().trim().min(1).max(255),
    receiverPhone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
    note: z.string().max(1000).nullish(),
    items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().positive().max(10000), expectedUnitPrice: z.number().int().min(0) })).min(1).max(50),
  }),
}), async (req, res, next) => {
  try {
    await ensureOperationsSchema();
    const tableRows = await prisma.$queryRaw<any[]>`SELECT id,market_id,stall_id,code,name FROM market_tables WHERE qr_token=${req.params.token} AND status='active' LIMIT 1`;
    const table = tableRows[0];
    if (!table) throw notFound('Mã bàn không tồn tại hoặc đã ngừng hoạt động');
    const productIds = [...new Set(req.body.items.map((item: any) => item.productId))];
    if (productIds.length !== req.body.items.length) throw badRequest('Danh sách món bị trùng');
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.$queryRaw<any[]>`
        SELECT p.id,p.stall_id,p.name,p.images,p.price,p.unit,p.quantity,p.is_hidden,p.deleted_at,
               p.discount_type,p.discount_value,p.discount_start_at,p.discount_end_at,
               s.status stall_status,ma.status market_status,s.market_id
        FROM products p JOIN stalls s ON s.id=p.stall_id JOIN markets ma ON ma.id=s.market_id
        WHERE p.id=ANY(${productIds}::uuid[]) ORDER BY p.id FOR UPDATE
      `;
      const byId = new Map(products.map((product) => [product.id, product]));
      let total = 0;
      for (const item of req.body.items) {
        const product = byId.get(item.productId);
        if (!product || product.stall_id !== table.stall_id || product.market_id !== table.market_id || product.deleted_at || product.is_hidden || product.stall_status !== 'occupied' || product.market_status !== 'active') throw badRequest('TABLE_PRODUCT_UNAVAILABLE', 'Món không còn bán tại bàn này');
        const price = finalPrice(product, now);
        if (price !== item.expectedUnitPrice) throw badRequest('PRICE_CHANGED', 'Giá món đã thay đổi, vui lòng tải lại menu');
        if (Number(product.quantity) < item.quantity) throw badRequest('STOCK_NOT_ENOUGH', `Món ${product.name} không đủ số lượng`);
        total += Math.round(price * item.quantity);
      }
      const orderId = randomUUID();
      const code = genOrderCode(now);
      await tx.$executeRaw`
        INSERT INTO orders(id,code,customer_id,market_id,stall_id,table_id,status,receive_type,receiver_name,receiver_phone,note,total_amount)
        VALUES(${orderId}::uuid,${code},NULL,${table.market_id}::uuid,${table.stall_id}::uuid,${table.id}::uuid,'pending','pickup',${req.body.receiverName},${req.body.receiverPhone},${req.body.note ?? null},${total})
      `;
      for (const item of req.body.items) {
        const product = byId.get(item.productId)!;
        const price = finalPrice(product, now);
        const image = Array.isArray(product.images) && product.images[0]?.url ? product.images[0].url : null;
        await tx.$executeRaw`
          INSERT INTO order_items(order_id,product_id,product_name,product_image,unit,original_price,unit_price,quantity,line_total)
          VALUES(${orderId}::uuid,${product.id}::uuid,${product.name},${image},${product.unit},${product.price},${price},${item.quantity},${Math.round(price * item.quantity)})
        `;
        await tx.$executeRaw`UPDATE products SET quantity=quantity-${item.quantity},updated_at=now() WHERE id=${product.id}::uuid`;
      }
      const contract = await tx.contracts.findFirst({ where: { stall_id: table.stall_id, ended_at: null } });
      if (contract) await notifyUsers(tx, { userIds: [contract.merchant_id], marketId: table.market_id, title: 'Có đơn gọi món tại bàn', content: `Đơn ${code} tại bàn ${table.name || table.code}, tổng ${total.toLocaleString('vi-VN')}đ.`, type: 'order', refType: 'order', refId: orderId });
      const payment = await createMockPayment(tx, { marketId: table.market_id, stallId: table.stall_id, orderId, amount: total });
      return { id: orderId, code, table: { code: table.code, name: table.name }, totalAmount: total, receiverName: req.body.receiverName, receiverPhone: req.body.receiverPhone, status: 'pending', payment };
    }, { timeout: 20_000 });
    ok(res, result, 201);
  } catch (e) { next(e); }
});

tableQrPublicRouter.post('/:token/orders/:orderId/payment/simulate', validate({
  params: z.object({ token: z.string().trim().min(10).max(120), orderId: z.string().uuid() }),
  body: z.object({ status: z.enum(['paid', 'failed', 'expired', 'refunded']), failureReason: z.string().max(500).optional() }),
}), async (req, res, next) => {
  try { ok(res, await simulatePublicOrderPayment(req.params.orderId, req.params.token, req.body.status, req.body.failureReason)); } catch (e) { next(e); }
});
