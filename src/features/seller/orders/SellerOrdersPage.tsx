import { Box, Button, Card, CircularProgress, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetPaged, apiPatch, errMsg } from '@/services/api';
import { EmptyState, ErrorState, FixedHeader, LoadingScreen, Money, Screen, StatusChip } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { ORDER_STATUS, timeAgo } from '@/utils';
import type { Order, OrderStatus } from '@/types';

const TABS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'preparing', label: 'Đang chuẩn bị' },
  { value: 'ready', label: 'Sẵn sàng' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export function SellerOrdersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'' | OrderStatus>('');

  const q = useInfiniteQuery({
    queryKey: ['seller-orders', tab],
    queryFn: ({ pageParam }) =>
      apiGetPaged<Order>('/seller/orders', { status: tab || undefined, page: pageParam, limit: 15 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
  const orders = q.data?.pages.flatMap((p) => p.data) ?? [];

  const confirm = useMutation({
    mutationFn: (id: string) => apiPatch(`/seller/orders/${id}/status`, { status: 'confirmed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
      qc.invalidateQueries({ queryKey: ['seller-dashboard'] });
      toast.success('Đã xác nhận đơn');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Box>
      <FixedHeader>
        {/* Header xanh */}
        <Box sx={{ bgcolor: 'primary.main', color: '#fff', pt: 'calc(var(--app-safe-area-top) + 16px)', pb: 2, px: 2, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Đơn hàng</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>Quản lý đơn của sạp</Typography>
        </Box>

        {/* Tabs trạng thái */}
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #EEF0F2' }}>
          <Tabs
            value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons={false}
            sx={{ minHeight: 44, '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600, fontSize: 13, minWidth: 'auto', px: 1.5 } }}
          >
            {TABS.map((t) => <Tab key={t.value} value={t.value} label={t.label} />)}
          </Tabs>
        </Box>
      </FixedHeader>

      {q.isLoading ? (
        <LoadingScreen height={280} />
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<ShoppingBag size={40} strokeWidth={1.5} />} title="Chưa có đơn hàng" hint="Đơn ở trạng thái này sẽ hiển thị tại đây." />
      ) : (
        <Screen>
          <Stack gap={1.25}>
            {orders.map((o) => {
              const confirming = confirm.isPending && confirm.variables === o.id;
              return (
                <Card key={o.id} onClick={() => navigate(`/seller/orders/${o.id}`)} sx={{ p: 1.5, cursor: 'pointer' }}>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.75}>
                    <Typography variant="body2" fontWeight={700} noWrap flex={1}>{o.code}</Typography>
                    <StatusChip {...ORDER_STATUS[o.status]} />
                  </Stack>
                  <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={1}>
                    <Box minWidth={0}>
                      <Typography variant="body2" noWrap>{o.customer?.fullName ?? o.receiverName}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {o.itemCount ?? 0} sản phẩm · {timeAgo(o.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="primary.main" noWrap>
                      <Money value={o.totalAmount} />
                    </Typography>
                  </Stack>
                  {o.status === 'pending' && (
                    <Button
                      fullWidth variant="contained" size="small" sx={{ mt: 1.25 }} disabled={confirming}
                      startIcon={confirming ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}
                      onClick={(e) => { e.stopPropagation(); confirm.mutate(o.id); }}
                    >
                      {confirming ? 'Đang xác nhận...' : 'Xác nhận đơn'}
                    </Button>
                  )}
                </Card>
              );
            })}
          </Stack>

          {q.hasNextPage && (
            <Box textAlign="center" mt={2}>
              <Button variant="outlined" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
                {q.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
              </Button>
            </Box>
          )}
        </Screen>
      )}
    </Box>
  );
}
