import { Box, Button, Card, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Phone, StickyNote, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet, apiPatch, apiPost, errMsg } from '@/services/api';
import { ErrorState, LoadingScreen, Money, Screen, Sheet, StatusChip, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { formatDateTime, NEXT_ORDER_STATUS, ORDER_FLOW, ORDER_STATUS } from '@/utils';
import type { Order, OrderStatus } from '@/types';

const IMG_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23F3F4F6"/></svg>';
const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed', 'preparing'];

function stepTime(order: Order, step: OrderStatus): string | null {
  switch (step) {
    case 'pending': return order.createdAt;
    case 'confirmed': return order.confirmedAt;
    case 'preparing': return order.preparingAt;
    case 'ready': return order.readyAt;
    case 'completed': return order.completedAt;
    default: return null;
  }
}

export function SellerOrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const q = useQuery({
    queryKey: ['seller-order', id],
    queryFn: () => apiGet<Order>(`/seller/orders/${id}`),
    enabled: !!id,
  });
  const order = q.data;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['seller-order', id] });
    qc.invalidateQueries({ queryKey: ['seller-orders'] });
    qc.invalidateQueries({ queryKey: ['seller-dashboard'] });
  }

  const advance = useMutation({
    mutationFn: (next: OrderStatus) => apiPatch(`/seller/orders/${id}/status`, { status: next }),
    onSuccess: () => { invalidate(); toast.success('Đã cập nhật trạng thái'); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const cancel = useMutation({
    mutationFn: (r: string) => apiPost(`/seller/orders/${id}/cancel`, { reason: r }),
    onSuccess: () => { invalidate(); toast.success('Đã hủy đơn'); setCancelOpen(false); setReason(''); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const next = order ? NEXT_ORDER_STATUS[order.status] : undefined;
  const cancellable = !!order && CANCELLABLE.includes(order.status);
  const currentIndex = order ? ORDER_FLOW.indexOf(order.status) : -1;

  return (
    <Box>
      <TopBar title={order ? `Đơn ${order.code}` : 'Chi tiết đơn'} onBack />

      {q.isLoading ? (
        <LoadingScreen height={320} />
      ) : q.isError || !order ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : (
        <>
          <Screen pb={next || cancellable ? 14 : 4}>
            {/* Trạng thái + tiến trình */}
            <Card sx={{ p: 1.75, mb: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={order.status === 'cancelled' ? 1.5 : 2}>
                <Typography variant="subtitle2">Trạng thái đơn</Typography>
                <StatusChip {...ORDER_STATUS[order.status]} />
              </Stack>

              {order.status === 'cancelled' ? (
                <Stack direction="row" gap={1.25} sx={{ bgcolor: 'rgba(239,68,68,0.08)', color: '#B91C1C', borderRadius: 2, p: 1.25 }}>
                  <XCircle size={20} />
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Đơn đã hủy{order.cancelledBy ? ` (bởi ${cancelledByLabel(order.cancelledBy)})` : ''}</Typography>
                    {order.cancelReason && <Typography variant="caption" display="block">Lý do: {order.cancelReason}</Typography>}
                    {order.cancelledAt && <Typography variant="caption" color="text.secondary">{formatDateTime(order.cancelledAt)}</Typography>}
                  </Box>
                </Stack>
              ) : (
                <Box>
                  {ORDER_FLOW.map((step, i) => {
                    const ts = stepTime(order, step);
                    const done = !!ts || i <= currentIndex;
                    const isCurrent = step === order.status;
                    return (
                      <Box key={step} sx={{ display: 'flex', gap: 1.25 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              bgcolor: done ? 'primary.main' : '#E5E7EB', color: '#fff',
                              boxShadow: isCurrent ? '0 0 0 4px rgba(22,163,74,0.15)' : 'none',
                            }}
                          >
                            {done ? <Check size={13} /> : <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#fff' }} />}
                          </Box>
                          {i < ORDER_FLOW.length - 1 && (
                            <Box sx={{ width: 2, flex: 1, minHeight: 18, my: 0.25, bgcolor: i < currentIndex ? 'primary.main' : '#E5E7EB' }} />
                          )}
                        </Box>
                        <Box sx={{ pb: i < ORDER_FLOW.length - 1 ? 2 : 0 }}>
                          <Typography variant="body2" fontWeight={isCurrent ? 700 : 600} color={done ? 'text.primary' : 'text.secondary'}>
                            {ORDER_STATUS[step].label}
                          </Typography>
                          {ts && <Typography variant="caption" color="text.secondary">{formatDateTime(ts)}</Typography>}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Card>

            {/* Sản phẩm */}
            <Card sx={{ p: 1.75, mb: 1.5 }}>
              <Typography variant="subtitle2" mb={1.5}>Sản phẩm ({order.orderItems?.length ?? 0})</Typography>
              <Stack gap={1.5}>
                {order.orderItems?.map((it) => (
                  <Stack key={it.id} direction="row" gap={1.25} alignItems="center">
                    <Box component="img" src={it.productImage || IMG_FALLBACK} alt={it.productName} sx={{ width: 52, height: 52, borderRadius: 2, objectFit: 'cover', bgcolor: '#F3F4F6', flexShrink: 0 }} />
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={600} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {it.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {it.quantity} {it.unit} × <Money value={it.unitPrice} />
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} noWrap><Money value={it.lineTotal} /></Typography>
                  </Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2">Tổng cộng</Typography>
                <Typography variant="h6" color="primary.main"><Money value={order.totalAmount} /></Typography>
              </Stack>
            </Card>

            {/* Thông tin khách */}
            <Card sx={{ p: 1.75 }}>
              <Typography variant="subtitle2" mb={1.5}>Thông tin nhận hàng</Typography>
              <Stack gap={1.25}>
                <Stack direction="row" gap={1.25} alignItems="center">
                  <User size={18} color="#6B7280" />
                  <Typography variant="body2" fontWeight={500} flex={1}>{order.receiverName}</Typography>
                  <StatusChip label={order.receiveType === 'delivery' ? 'Giao hàng' : 'Nhận tại sạp'} tone="default" />
                </Stack>
                <Stack direction="row" gap={1.25} alignItems="center">
                  <Phone size={18} color="#6B7280" />
                  <Typography variant="body2" fontWeight={500} flex={1}>{order.receiverPhone}</Typography>
                  <Button component="a" href={`tel:${order.receiverPhone}`} size="small" variant="outlined" sx={{ py: 0.25 }}>Gọi</Button>
                </Stack>
                {order.note && (
                  <Stack direction="row" gap={1.25} alignItems="flex-start">
                    <StickyNote size={18} color="#6B7280" style={{ marginTop: 2 }} />
                    <Typography variant="body2" color="text.secondary">{order.note}</Typography>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Screen>

          {/* Thanh hành động */}
          {(next || cancellable) && (
            <Box sx={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, bgcolor: '#fff', borderTop: '1px solid #EEF0F2', px: 2, py: 1.5, pb: 'calc(env(safe-area-inset-bottom) + 12px)', zIndex: 20, display: 'flex', gap: 1 }}>
              {cancellable && (
                <Button variant="outlined" color="error" onClick={() => setCancelOpen(true)} sx={{ flex: next ? '0 0 auto' : 1 }}>
                  Hủy đơn
                </Button>
              )}
              {next && (
                <Button
                  variant="contained" fullWidth onClick={() => { if (next) advance.mutate(next); }} disabled={advance.isPending}
                  startIcon={advance.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  Chuyển sang: {ORDER_STATUS[next].label}
                </Button>
              )}
            </Box>
          )}
        </>
      )}

      {/* Hủy đơn — nhập lý do */}
      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="Hủy đơn hàng">
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          Vui lòng nhập lý do hủy để thông báo cho khách hàng.
        </Typography>
        <TextField
          fullWidth multiline minRows={3} placeholder="VD: Sạp đã hết hàng..." value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          fullWidth variant="contained" color="error" size="large" sx={{ mt: 2 }}
          disabled={!reason.trim() || cancel.isPending}
          startIcon={cancel.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
          onClick={() => cancel.mutate(reason.trim())}
        >
          {cancel.isPending ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
        </Button>
      </Sheet>
    </Box>
  );
}

function cancelledByLabel(by: 'buyer' | 'seller' | 'admin'): string {
  return by === 'buyer' ? 'khách' : by === 'seller' ? 'bạn' : 'quản trị';
}
