import { Router } from 'express';
import { z } from 'zod';
import dayjs, { Dayjs } from 'dayjs';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { validate } from '../../middlewares/validate.middleware';
import { pageQuery } from '../../shared/pagination';
import { assertMarketInScope, marketFilter, marketIdsForScope } from '../../shared/scope';

export const complianceAdminRouter = Router(); // mount tại /admin/compliance

const periodSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Kỳ báo cáo phải có dạng YYYY-MM');
const debtAgeSchema = z.enum(['all', '1', '2', '3', 'over_3']);

function rate(value: number, total: number) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

async function scopeMarketIds(req: any, marketId?: string) {
  let ids = await marketIdsForScope(req.scope);
  if (marketId) {
    await assertMarketInScope(req.scope, marketId);
    ids = [marketId];
  }
  return ids;
}

function isContractValidAt(
  contract: { start_date: Date; end_date: Date | null; ended_at: Date | null },
  at: Dayjs,
) {
  if (dayjs(contract.start_date).isAfter(at, 'day')) return false;
  if (contract.end_date && dayjs(contract.end_date).isBefore(at, 'day')) return false;
  if (contract.ended_at && dayjs(contract.ended_at).isBefore(at.endOf('day'))) return false;
  return true;
}

async function loadCompliance(req: any, marketId: string | undefined, period: string) {
  const periodEnd = dayjs(`${period}-01`).endOf('month');
  const trendStart = periodEnd.subtract(5, 'month').startOf('month');
  const [marketIds, stallScope] = await Promise.all([
    scopeMarketIds(req, marketId),
    marketFilter(req.scope, marketId),
  ]);
  const merchantMarketWhere = marketIds
    ? { merchant_market_id: { in: marketIds } }
    : { merchant_market_id: { not: null } };

  const merchants = await prisma.users.findMany({
    where: {
      role: 'user',
      merchant_status: { not: null },
      ...merchantMarketWhere,
    },
    select: {
      id: true,
      full_name: true,
      avatar: true,
      phone: true,
      categories: { select: { id: true, name: true } },
    },
  });
  const merchantIds = merchants.map((merchant) => merchant.id);
  const contracts = merchantIds.length
    ? await prisma.contracts.findMany({
        where: {
          merchant_id: { in: merchantIds },
          start_date: { lte: periodEnd.toDate() },
          OR: [{ end_date: null }, { end_date: { gte: trendStart.toDate() } }],
          stalls: stallScope,
        },
        orderBy: { start_date: 'desc' },
        select: {
          id: true,
          merchant_id: true,
          start_date: true,
          end_date: true,
          ended_at: true,
          fee: true,
          stalls: { select: { id: true, code: true, name: true } },
        },
      })
    : [];
  const stallIds = [...new Set(contracts.map((contract) => contract.stalls.id))];
  const [complaintGroups, traceableGroups] = await Promise.all([
    stallIds.length
      ? prisma.complaints.groupBy({
          by: ['stall_id'],
          where: {
            stall_id: { in: stallIds },
            status: { in: ['new', 'processing', 'escalated'] },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    merchantIds.length
      ? prisma.products.groupBy({
          by: ['owner_merchant_id'],
          where: {
            owner_merchant_id: { in: merchantIds },
            deleted_at: null,
            stalls: stallScope,
            traceability: { isNot: null },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);
  const complaintsByStall = new Map(
    complaintGroups.map((row) => [row.stall_id as string, row._count._all]),
  );
  const traceableByMerchant = new Map(
    traceableGroups.map((row) => [row.owner_merchant_id as string, row._count._all]),
  );
  const contractsByMerchant = new Map<string, typeof contracts>();
  for (const contract of contracts) {
    const rows = contractsByMerchant.get(contract.merchant_id) ?? [];
    rows.push(contract);
    contractsByMerchant.set(contract.merchant_id, rows);
  }

  const merchantRows = merchants.map((merchant) => {
    const merchantContracts = contractsByMerchant.get(merchant.id) ?? [];
    const contract = merchantContracts.find((item) =>
      isContractValidAt(item, periodEnd),
    ) ?? merchantContracts[0] ?? null;
    const contractValid = contract ? isContractValidAt(contract, periodEnd) : false;
    const fee = contract?.fee.toNumber() ?? 0;
    const openComplaintCount = contract
      ? (complaintsByStall.get(contract.stalls.id) ?? 0)
      : 0;
    const traceableProductCount = traceableByMerchant.get(merchant.id) ?? 0;
    const daysToExpiry = contract?.end_date
      ? dayjs(contract.end_date).diff(periodEnd, 'day')
      : null;
    const overdue = Boolean(contract && !contractValid && daysToExpiry !== null && daysToExpiry < 0);
    const debtMonths = overdue && daysToExpiry !== null
      ? Math.max(1, Math.ceil(Math.abs(daysToExpiry) / 30))
      : 0;
    const expiring = Boolean(
      contractValid && daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30,
    );
    const missingFee = Boolean(contract && fee <= 0);
    const compliant = contractValid && !missingFee && openComplaintCount === 0;
    const issues = [
      ...(overdue ? ['overdue'] : []),
      ...(expiring ? ['expiring'] : []),
      ...(openComplaintCount ? ['complaint'] : []),
      ...(missingFee ? ['missing_fee'] : []),
      ...(!contract ? ['missing_contract'] : []),
    ];
    const severity: 'high' | 'medium' | 'low' = overdue || openComplaintCount > 1
      ? 'high'
      : issues.length
        ? 'medium'
        : 'low';
    return {
      id: merchant.id,
      full_name: merchant.full_name,
      avatar: merchant.avatar,
      phone: merchant.phone,
      category: merchant.categories,
      stall: contract?.stalls ?? null,
      contract_id: contract?.id ?? null,
      contract_start_date: contract?.start_date ?? null,
      contract_end_date: contract?.end_date ?? null,
      contract_fee: fee,
      contract_valid: contractValid,
      days_to_expiry: daysToExpiry,
      open_complaint_count: openComplaintCount,
      traceable_product_count: traceableProductCount,
      compliant,
      issues,
      severity,
      debt_months: debtMonths,
      debt_total: overdue ? fee : 0,
      latest_due_date: overdue ? contract?.end_date ?? null : null,
    };
  });

  const selectedContracts = contracts.filter((contract) =>
    isContractValidAt(contract, periodEnd),
  );
  const feeDeclared = selectedContracts.filter((contract) => contract.fee.gt(0)).length;
  const validMerchantCount = merchantRows.filter((row) => row.contract_valid).length;
  const noComplaintCount = merchantRows.filter(
    (row) => row.contract_valid && row.open_complaint_count === 0,
  ).length;
  const traceableCount = merchantRows.filter((row) => row.traceable_product_count > 0).length;
  const compliantCount = merchantRows.filter((row) => row.compliant).length;
  const attentionCount = merchantRows.filter((row) => row.issues.length > 0).length;
  const totalContractFee = selectedContracts.reduce(
    (sum, contract) => sum + contract.fee.toNumber(),
    0,
  );
  const debtMerchantCount = merchantRows.filter((row) => row.debt_months > 0).length;
  const onTimeMerchantCount = Math.max(merchants.length - debtMerchantCount, 0);
  const totalReceivable = merchantRows.reduce((sum, row) => sum + row.contract_fee, 0);
  const totalDebt = merchantRows.reduce((sum, row) => sum + row.debt_total, 0);
  const totalCollected = Math.max(totalReceivable - totalDebt, 0);

  const trends = Array.from({ length: 6 }, (_, index) => {
    const month = periodEnd.subtract(5 - index, 'month');
    const valid = contracts.filter((contract) => isContractValidAt(contract, month.endOf('month')));
    const withFee = valid.filter((contract) => contract.fee.gt(0));
    return {
      period: month.format('YYYY-MM'),
      label: month.format('MM/YYYY'),
      active_contracts: valid.length,
      declared_fee: withFee.reduce((sum, contract) => sum + contract.fee.toNumber(), 0),
      compliance_rate: rate(withFee.length, valid.length),
    };
  });

  return {
    period,
    period_end: periodEnd.toDate(),
    total_merchants: merchants.length,
    compliant_merchants: compliantCount,
    compliance_rate: rate(compliantCount, merchants.length),
    active_contracts: selectedContracts.length,
    total_contract_fee: totalContractFee,
    on_time_merchant_count: onTimeMerchantCount,
    on_time_payment_rate: rate(onTimeMerchantCount, merchants.length),
    total_receivable: totalReceivable,
    total_collected: totalCollected,
    collection_rate: rate(totalCollected, totalReceivable),
    total_debt: totalDebt,
    debt_rate: rate(totalDebt, totalReceivable),
    debt_merchant_count: debtMerchantCount,
    debt_merchant_rate: rate(debtMerchantCount, merchants.length),
    attention_merchants: attentionCount,
    overdue_contracts: merchantRows.filter((row) => row.issues.includes('overdue')).length,
    expiring_contracts: merchantRows.filter((row) => row.issues.includes('expiring')).length,
    missing_fee_contracts: merchantRows.filter((row) => row.issues.includes('missing_fee')).length,
    open_complaints: merchantRows.reduce((sum, row) => sum + row.open_complaint_count, 0),
    debt_age_stats: {
      all: merchantRows.filter((row) => row.debt_months > 0).length,
      month_1: merchantRows.filter((row) => row.debt_months === 1).length,
      month_2: merchantRows.filter((row) => row.debt_months === 2).length,
      month_3: merchantRows.filter((row) => row.debt_months === 3).length,
      over_3: merchantRows.filter((row) => row.debt_months > 3).length,
    },
    obligation_stats: [
      {
        code: 'valid_contract',
        name: 'Hợp đồng còn hiệu lực',
        fulfilled: validMerchantCount,
        total: merchants.length,
        rate: rate(validMerchantCount, merchants.length),
      },
      {
        code: 'declared_fee',
        name: 'Phí hợp đồng đã khai báo',
        fulfilled: feeDeclared,
        total: selectedContracts.length,
        rate: rate(feeDeclared, selectedContracts.length),
      },
      {
        code: 'no_complaint',
        name: 'Không phản ánh tồn đọng',
        fulfilled: noComplaintCount,
        total: validMerchantCount,
        rate: rate(noComplaintCount, validMerchantCount),
      },
      {
        code: 'traceability',
        name: 'Có sản phẩm truy xuất',
        fulfilled: traceableCount,
        total: merchants.length,
        rate: rate(traceableCount, merchants.length),
      },
    ],
    trends,
    merchants: merchantRows,
  };
}

// GET /admin/compliance/summary
complianceAdminRouter.get(
  '/summary',
  validate({
    query: z.object({
      marketId: z.string().uuid().optional(),
      period: periodSchema.default(dayjs().format('YYYY-MM')),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const data = await loadCompliance(req, q.marketId, q.period);
      const { merchants, ...summary } = data;
      ok(res, summary);
    } catch (error) {
      next(error);
    }
  },
);

// GET /admin/compliance/traders
complianceAdminRouter.get(
  '/traders',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      period: periodSchema.default(dayjs().format('YYYY-MM')),
      debtAge: debtAgeSchema.default('all'),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const data = await loadCompliance(req, q.marketId, q.period);
      const keyword = String(q.search ?? '').toLocaleLowerCase('vi');
      const rows = data.merchants
        .filter((row) => row.issues.includes('overdue'))
        .filter((row) => {
          if (q.debtAge === 'all') return true;
          if (q.debtAge === 'over_3') return row.debt_months > 3;
          return row.debt_months === Number(q.debtAge);
        })
        .filter(
          (row) =>
            !keyword ||
            row.full_name.toLocaleLowerCase('vi').includes(keyword) ||
            row.phone?.includes(keyword) ||
            row.stall?.code.toLocaleLowerCase('vi').includes(keyword) ||
            row.category?.name.toLocaleLowerCase('vi').includes(keyword),
        )
        .sort((a, b) => {
          const severity = { high: 0, medium: 1, low: 2 } as const;
          return severity[a.severity] - severity[b.severity] || a.full_name.localeCompare(b.full_name, 'vi');
        });
      const start = (q.page - 1) * q.limit;
      paginated(res, rows.slice(start, start + q.limit), {
        page: q.page,
        limit: q.limit,
        total: rows.length,
      });
    } catch (error) {
      next(error);
    }
  },
);
