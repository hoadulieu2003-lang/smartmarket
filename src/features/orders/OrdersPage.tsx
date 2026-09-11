import { Box, Button, Card, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ClipboardList, Store } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, FixedHeader, LoadingScreen, Money, Screen, StatusChip, TopBar } from '@/components/ui/bits';
import { apiGetPaged } from '@/services/api';
import { ORDER_STATUS, timeAgo } from '@/utils';
import type { Order, OrderStatus } from '@/types';

const IMG_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23F3F4F6"/></svg>';

const TABS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'preparing', label: 'Đang chuẩn bị' },
  { value: 'ready', label: 'Sẵn sàng' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
];

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const st = ORDER_STATUS[order.status];
  const first = order.firstItem;
  const others = (order.itemCount ?? 0) - 1;
  const stall = order.stalls?.name || (order.stalls?.code ? `Sạp ${order.stalls.code}` : '');
  return (
    <Card onClick={onClick} sx={{ p: 1.5, cursor: 'pointer' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          #{order.code}
        </Typography>
        <StatusChip label={st.label} tone={st.tone} />
      </Stack>
      <Stack direction="row" gap={1.25}>
        <Box
          component="img"
          src={first?.productImage || IMG_FALLBACK}
          alt={first?.productName ?? 'Đơn hàng'}
          sx={{ width: 56, height: 56, borderRadius: 2, objectFit: 'cover', flexShrink: 0, bgcolor: '#F3F4F6' }}
        />
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {first?.productName ?? 'Đơn hàng'}
          </Typography>
          {others > 0 && (
            <Typography variant="caption" color="text.secondary" display="block">
              và {others} sản phẩm khác
            </Typography>
          )}
          {stall && (
            <Stack direction="row" alignItems="center" gap={0.5} mt={0.25}>
              <Store size={13} color="#9CA3AF" />
              <Typography variant="caption" color="text.secondary" noWrap>
                {stall}
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mt={1}
        pt={1}
        sx={{ borderTop: '1px dashed #EEF0F2' }}
      >
        <Typography variant="caption" color="text.secondary">
          {timeAgo(order.createdAt)}
        </Typography>
        <Typography variant="subtitle2" color="primary.main">
          <Money value={order.totalAmount} />
        </Typography>
      </Stack>
    </Card>
  );
}

export function OrdersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'' | OrderStatus>('');

  const q = useInfiniteQuery({
    queryKey: ['orders', tab],
    queryFn: ({ pageParam }) =>
      apiGetPaged<Order>('/orders', { status: tab || undefined, page: pageParam, limit: 15 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });

  const orders = q.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Box>
      <TopBar title="Đơn hàng của tôi" onBack />
      <FixedHeader sx={{ top: 'var(--app-topbar-height)', zIndex: 29, bgcolor: '#fff', borderBottom: '1px solid #EEF0F2' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ minHeight: 44, px: 0.5, '& .MuiTab-root': { minHeight: 44, py: 1, fontWeight: 600, fontSize: 13 } }}
        >
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} />
          ))}
        </Tabs>
      </FixedHeader>
      <Screen>
        {q.isLoading ? (
          <LoadingScreen />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={40} strokeWidth={1.5} />}
            title="Chưa có đơn hàng"
            hint="Các đơn bạn đặt sẽ hiển thị ở đây."
          />
        ) : (
          <Stack gap={1.25}>
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onClick={() => navigate(`/orders/${o.id}`)} />
            ))}
            {q.hasNextPage && (
              <Button
                variant="outlined"
                onClick={() => q.fetchNextPage()}
                disabled={q.isFetchingNextPage}
                sx={{ mt: 0.5 }}
              >
                {q.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
              </Button>
            )}
          </Stack>
        )}
      </Screen>
    </Box>
  );
}
