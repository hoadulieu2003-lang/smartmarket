import { Box, Card, Grid2 as Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, Clock, MapPin, Package, PackageX, ShoppingBag, Star, Store, Tag, Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { EmptyState, ErrorState, FixedHeader, LoadingScreen, Money, Screen, StatusChip } from '@/components/ui/bits';
import { SectionHeader } from '@/components/common';
import { useAuth } from '@/stores';
import { formatMoney, ORDER_STATUS, timeAgo } from '@/utils';
import type { SellerDashboard } from '@/types';

/** Ô chỉ số nhỏ (KPI). */
function Kpi({ icon, label, value, tint }: { icon: ReactNode; label: string; value: ReactNode; tint: string }) {
  return (
    <Card sx={{ p: 1.5, height: '100%' }}>
      <Stack direction="row" alignItems="center" gap={1.25}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: `${tint}1F`, color: tint,
          }}
        >
          {icon}
        </Box>
        <Box minWidth={0}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">{label}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}

export function SellerDashboardPage() {
  const navigate = useNavigate();
  const { seller } = useAuth();

  const q = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => apiGet<SellerDashboard>('/seller/dashboard'),
  });
  const d = q.data;

  const kpis = d
    ? [
        { icon: <ShoppingBag size={20} />, label: 'Đơn mới', value: d.newOrderCount, tint: '#F59E0B' },
        { icon: <Clock size={20} />, label: 'Đang xử lý', value: d.processingOrderCount, tint: '#3B82F6' },
        { icon: <Package size={20} />, label: 'Đang bán', value: d.sellingProductCount, tint: '#16A34A' },
        { icon: <PackageX size={20} />, label: 'Hết hàng', value: d.outOfStockCount, tint: '#EF4444' },
        { icon: <Tag size={20} />, label: 'Đang giảm', value: d.onSaleCount, tint: '#2563EB' },
        { icon: <Star size={20} />, label: 'Đánh giá TB', value: d.ratingAvg ? d.ratingAvg.toFixed(1) : '—', tint: '#F59E0B' },
      ]
    : [];

  return (
    <Box>
      {/* Header xanh: sạp + chợ */}
      <FixedHeader
        sx={{
          bgcolor: 'primary.main', color: '#fff',
          pt: 'calc(var(--app-safe-area-top) + 16px)', pb: 4, px: 2,
          borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box sx={{ width: 46, height: 46, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Store size={24} />
          </Box>
          <Box minWidth={0}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }} noWrap>
              {seller?.stallName || seller?.stallCode || 'Sạp của tôi'}
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ opacity: 0.9 }}>
              <MapPin size={14} />
              <Typography variant="caption" noWrap>{seller?.marketName ?? ''}</Typography>
            </Stack>
          </Box>
        </Stack>
      </FixedHeader>

      {q.isLoading ? (
        <LoadingScreen height={320} />
      ) : q.isError || !d ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : (
        <>
          {/* Doanh thu hôm nay */}
          <Box sx={{ px: 2, mt: 2 }}>
            <Card sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" gap={1.5}>
                <Box sx={{ width: 46, height: 46, borderRadius: 3, bgcolor: 'rgba(22,163,74,0.12)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Wallet size={24} />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="caption" color="text.secondary">Doanh thu hôm nay</Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}>
                    {formatMoney(d.todayRevenue)}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Box>

          <Screen>
            {/* Lưới KPI */}
            <Grid container spacing={1.25}>
              {kpis.map((k) => (
                <Grid key={k.label} size={6}>
                  <Kpi icon={k.icon} label={k.label} value={k.value} tint={k.tint} />
                </Grid>
              ))}
            </Grid>

            {/* Đơn gần đây */}
            <Box mt={3}>
              <SectionHeader
                title="Đơn gần đây"
                action={d.recentOrders.length ? 'Tất cả' : undefined}
                onAction={() => navigate('/seller/orders')}
              />
              {d.recentOrders.length === 0 ? (
                <EmptyState icon={<ShoppingBag size={38} strokeWidth={1.5} />} title="Chưa có đơn hàng" hint="Đơn của khách sẽ xuất hiện tại đây." />
              ) : (
                <Stack gap={1}>
                  {d.recentOrders.map((o) => (
                    <Card key={o.id} onClick={() => navigate(`/seller/orders/${o.id}`)} sx={{ p: 1.25, cursor: 'pointer' }}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Box flex={1} minWidth={0}>
                          <Stack direction="row" alignItems="center" gap={0.75} mb={0.25}>
                            <Typography variant="body2" fontWeight={700} noWrap>{o.code}</Typography>
                            <StatusChip {...ORDER_STATUS[o.status]} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {o.receiverName} · {timeAgo(o.createdAt)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700} color="primary.main" noWrap>
                          <Money value={o.totalAmount} />
                        </Typography>
                        <ChevronRight size={18} color="#9CA3AF" />
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </Screen>
        </>
      )}
    </Box>
  );
}
