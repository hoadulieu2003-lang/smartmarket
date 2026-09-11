import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert, Phone, QrCode, Star, Store } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState, LoadingScreen, Money, Screen, StatusChip, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { apiGet, apiPost, errMsg } from '@/services/api';
import { formatDateTime, ORDER_STATUS } from '@/utils';
import type { Order, OrderItem, OrderStatus } from '@/types';

const IMG_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23F3F4F6"/></svg>';

const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed'];

const STEPS: { label: string; at: (o: Order) => string | null }[] = [
  { label: 'Đã đặt đơn', at: (o) => o.createdAt },
  { label: 'Đã xác nhận', at: (o) => o.confirmedAt },
  { label: 'Đang chuẩn bị', at: (o) => o.preparingAt },
  { label: 'Sẵn sàng lấy hàng', at: (o) => o.readyAt },
  { label: 'Hoàn tất', at: (o) => o.completedAt },
];

type TimelineRow = { label: string; at: string | null; cancelled?: boolean };

/** Khối card có tiêu đề. */
function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Card sx={{ p: 1.75 }}>
      {title && (
        <Typography variant="subtitle2" mb={1.5}>
          {title}
        </Typography>
      )}
      {children}
    </Card>
  );
}

/** Cặp nhãn – giá trị (căn ngang). */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction="row" gap={1.5} alignItems="flex-start">
      <Typography variant="body2" color="text.secondary" sx={{ width: 96, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box flex={1} minWidth={0} sx={{ textAlign: 'right' }}>
        <Typography variant="body2" component="div" fontWeight={500}>
          {children ?? '—'}
        </Typography>
      </Box>
    </Stack>
  );
}

/** Tiến trình đơn — timeline dọc theo mốc thời gian. */
function Timeline({ order }: { order: Order }) {
  const cancelled = order.status === 'cancelled';
  const rows: TimelineRow[] = STEPS.map((s) => ({ label: s.label, at: s.at(order) })).filter(
    (r) => !cancelled || !!r.at,
  );
  if (cancelled) rows.push({ label: 'Đã hủy', at: order.cancelledAt, cancelled: true });

  return (
    <Stack>
      {rows.map((r, idx) => {
        const done = !!r.at;
        const isCancel = !!r.cancelled;
        const last = idx === rows.length - 1;
        const dotColor = isCancel ? '#EF4444' : done ? '#16A34A' : '#D1D5DB';
        const next = rows[idx + 1];
        const lineColor = next?.cancelled ? '#EF4444' : next?.at ? '#16A34A' : '#E5E7EB';
        return (
          <Stack key={idx} direction="row" gap={1.25}>
            <Stack alignItems="center" sx={{ width: 14, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  mt: 0.25,
                  bgcolor: done || isCancel ? dotColor : '#fff',
                  border: `2px solid ${dotColor}`,
                }}
              />
              {!last && <Box sx={{ width: 2, flex: 1, minHeight: 26, bgcolor: lineColor }} />}
            </Stack>
            <Box flex={1} pb={last ? 0 : 1.5}>
              <Typography
                variant="body2"
                fontWeight={done || isCancel ? 600 : 400}
                color={done || isCancel ? 'text.primary' : 'text.secondary'}
              >
                {r.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {r.at ? formatDateTime(r.at) : 'Đang chờ'}
              </Typography>
              {isCancel && order.cancelReason && (
                <Typography variant="caption" color="error.main" display="block">
                  Lý do: {order.cancelReason}
                </Typography>
              )}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

function ItemRow({ item, onReview }: { item: OrderItem; onReview?: () => void }) {
  const discounted = item.originalPrice > 0 && item.originalPrice !== item.unitPrice;
  return (
    <Stack direction="row" gap={1.25} alignItems="flex-start">
      <Box
        component="img"
        src={item.productImage || IMG_FALLBACK}
        alt={item.productName}
        sx={{ width: 56, height: 56, borderRadius: 2, objectFit: 'cover', flexShrink: 0, bgcolor: '#F3F4F6' }}
      />
      <Box flex={1} minWidth={0}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {item.productName}
        </Typography>
        <Stack direction="row" alignItems="baseline" gap={0.75} mt={0.25} flexWrap="wrap">
          <Typography component="span" variant="body2" color="primary.main" fontWeight={700}>
            <Money value={item.unitPrice} />
          </Typography>
          {discounted && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
              <Money value={item.originalPrice} />
            </Typography>
          )}
          <Typography component="span" variant="caption" color="text.secondary">
            × {item.quantity} {item.unit}
          </Typography>
        </Stack>
        {onReview && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Star size={14} />}
            onClick={onReview}
            sx={{ mt: 0.75, py: 0.25 }}
          >
            Đánh giá
          </Button>
        )}
      </Box>
      <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0 }}>
        <Money value={item.lineTotal} />
      </Typography>
    </Stack>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  const q = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    enabled: !!id,
  });

  const cancel = useMutation({
    mutationFn: () => apiPost(`/orders/${id}/cancel`, { reason: reason.trim() || undefined }),
    onSuccess: () => {
      setDialogOpen(false);
      setReason('');
      toast.success('Đã hủy đơn hàng');
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const simulatePayment = useMutation({
    mutationFn: (status: 'paid' | 'failed') => apiPost(`/orders/${id}/payment/simulate`, { status, failureReason: status === 'failed' ? 'Người dùng mô phỏng giao dịch thất bại' : undefined }),
    onSuccess: (_result, status) => { toast.success(status === 'paid' ? 'Đã mô phỏng thanh toán thành công' : 'Đã mô phỏng thanh toán thất bại'); qc.invalidateQueries({ queryKey: ['order', id] }); },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (q.isLoading) {
    return (
      <Box>
        <TopBar title="Chi tiết đơn hàng" onBack />
        <LoadingScreen height={320} />
      </Box>
    );
  }

  const order = q.data;
  if (q.isError || !order) {
    return (
      <Box>
        <TopBar title="Chi tiết đơn hàng" onBack />
        <Screen>
          <EmptyState title="Không tìm thấy đơn hàng" hint="Đơn hàng không tồn tại hoặc đã bị xóa." />
        </Screen>
      </Box>
    );
  }

  const st = ORDER_STATUS[order.status];
  const canCancel = CANCELLABLE.includes(order.status);
  const isCompleted = order.status === 'completed';
  const stallName = order.stalls?.name || (order.stalls?.code ? `Sạp ${order.stalls.code}` : '—');

  return (
    <Box>
      <TopBar title={`Đơn #${order.code}`} onBack />
      <Screen>
        <Stack gap={1.5}>
          {/* Trạng thái */}
          <Card sx={{ p: 1.75 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box minWidth={0}>
                <Typography variant="subtitle1" noWrap>
                  Đơn #{order.code}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(order.createdAt)}
                </Typography>
              </Box>
              <StatusChip label={st.label} tone={st.tone} />
            </Stack>
          </Card>

          {/* Tiến trình đơn */}
          <Section title="Tiến trình đơn hàng">
            <Timeline order={order} />
          </Section>

          {/* Sản phẩm */}
          <Section title={`Sản phẩm (${order.orderItems?.length ?? 0})`}>
            <Stack gap={1.75} divider={<Box sx={{ borderTop: '1px dashed #EEF0F2' }} />}>
              {order.orderItems?.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onReview={
                    isCompleted
                      ? () => navigate(`/reviews/create?productId=${it.productId}&orderId=${order.id}`)
                      : undefined
                  }
                />
              ))}
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1.5} pt={1.5} sx={{ borderTop: '1px solid #EEF0F2' }}>
              <Typography variant="subtitle2">Tổng cộng</Typography>
              <Typography variant="h6" color="primary.main">
                <Money value={order.totalAmount} />
              </Typography>
            </Stack>
          </Section>

          {/* Thông tin nhận hàng */}
          <Section title="Thông tin nhận hàng">
            <Stack gap={1}>
              <InfoRow label="Người nhận">{order.receiverName}</InfoRow>
              <InfoRow label="Số điện thoại">
                <Box component="a" href={`tel:${order.receiverPhone}`} sx={{ color: 'primary.main', textDecoration: 'none' }}>
                  {order.receiverPhone}
                </Box>
              </InfoRow>
              <InfoRow label="Hình thức">
                {order.receiveType === 'pickup' ? 'Nhận tại sạp' : 'Giao hàng'}
              </InfoRow>
              {order.note && <InfoRow label="Ghi chú">{order.note}</InfoRow>}
            </Stack>
          </Section>

          {/* Thông tin sạp */}
          <Section title="Thông tin sạp">
            <Stack gap={1.25}>
              <Stack direction="row" alignItems="center" gap={1.25}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'rgba(22,163,74,0.1)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Store size={20} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {stallName}
                  </Typography>
                  {order.markets?.name && (
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {order.markets.name}
                      {order.markets.address ? ` · ${order.markets.address}` : ''}
                    </Typography>
                  )}
                </Box>
              </Stack>
              {order.stalls?.phone && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Phone size={16} />}
                  component="a"
                  href={`tel:${order.stalls.phone}`}
                >
                  Gọi sạp {order.stalls.phone}
                </Button>
              )}
            </Stack>
          </Section>

          {order.payment && <Section title="Thanh toán (mock sandbox)"><Stack gap={1.25}><Stack direction="row" gap={1.25} alignItems="center">{order.payment.status === 'paid' ? <CheckCircle2 color="#16A34A" /> : <QrCode color="#0B8F5A" />}<Box flex={1}><Typography variant="body2" fontWeight={700}>{order.payment.status === 'paid' ? 'Đã thanh toán' : order.payment.status === 'pending' ? 'Chờ thanh toán' : `Thanh toán ${order.payment.status}`}</Typography><Typography variant="caption" color="text.secondary">Mã: {order.payment.code}</Typography></Box></Stack>{order.payment.status === 'pending' && <><Box sx={{ p: 1.25, border: '1px dashed #A7DCC8', bgcolor: '#F3FBF7', borderRadius: 2 }}><Typography variant="caption" color="text.secondary">QR giả lập</Typography><Typography variant="body2" fontFamily="monospace" sx={{ mt: .5, wordBreak: 'break-all' }}>{order.payment.qrPayload}</Typography></Box><Stack direction="row" gap={1}><Button fullWidth variant="contained" onClick={() => simulatePayment.mutate('paid')} disabled={simulatePayment.isPending}>Mô phỏng đã trả</Button><Button fullWidth variant="outlined" color="error" startIcon={<CircleAlert size={16} />} onClick={() => simulatePayment.mutate('failed')} disabled={simulatePayment.isPending}>Mô phỏng lỗi</Button></Stack></>}</Stack></Section>}

          {/* Hủy đơn */}
          {canCancel && (
            <Button
              fullWidth
              color="error"
              variant="outlined"
              size="large"
              onClick={() => setDialogOpen(true)}
              sx={{ mt: 0.5 }}
            >
              Hủy đơn hàng
            </Button>
          )}
        </Stack>
      </Screen>

      {/* Dialog nhập lý do hủy */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Hủy đơn hàng</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Bạn có chắc muốn hủy đơn #{order.code}? Cho biết lý do sẽ giúp sạp phục vụ tốt hơn (không bắt buộc).
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            placeholder="Lý do hủy đơn..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Đóng
          </Button>
          <Button color="error" variant="contained" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
            {cancel.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
