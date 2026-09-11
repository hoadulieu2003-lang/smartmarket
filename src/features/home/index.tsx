import { Box, Card, Grid2 as Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { BadgePercent, MapPin, MessageSquareWarning, Package, QrCode, Search, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { EmptyState, FixedHeader, LoadingScreen, Screen } from '@/components/ui/bits';
import { ProductCard, SectionHeader, TraderCard } from '@/components/common';
import { useAuth } from '@/stores';
import type { MarketHome } from '@/types';

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Box component="button" onClick={onClick} sx={{ width: '100%', border: 0, bgcolor: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, py: 0.75 }}>
      <Box sx={{ width: 46, height: 46, borderRadius: 3, bgcolor: 'rgba(22,163,74,0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
      <Typography variant="caption" color="text.primary" fontWeight={500} textAlign="center" sx={{ lineHeight: 1.2 }}>{label}</Typography>
    </Box>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { user, selectedMarket } = useAuth();

  const home = useQuery({
    queryKey: ['market-home', selectedMarket?.id],
    queryFn: () => apiGet<MarketHome>(`/markets/${selectedMarket!.id}/home`),
    enabled: !!selectedMarket,
  });

  return (
    <Box>
      {/* Header xanh */}
      <FixedHeader contentGap={1} sx={{ bgcolor: 'primary.main', color: '#fff', pt: 'calc(var(--app-safe-area-top) + 16px)', pb: 2.5, px: 2, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>Xin chào{user?.fullName ? `, ${user.fullName}` : ''} 👋</Typography>
        <Box
          component="button"
          onClick={() => navigate('/markets')}
          sx={{ mt: 0.5, border: 0, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 3, px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', width: '100%' }}
        >
          <MapPin size={18} />
          <Typography variant="body2" fontWeight={600} flex={1} textAlign="left" noWrap>
            {selectedMarket ? selectedMarket.name : 'Chọn chợ để bắt đầu'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>Đổi chợ</Typography>
        </Box>
      </FixedHeader>

      {/* Quick actions — lưới 3 ngang 2 dọc */}
      <Box sx={{ px: 2 }}>
        <Card sx={{ p: 1.5 }}>
          <Grid container spacing={0.5}>
            <Grid size={4}><QuickAction icon={<Search size={22} />} label="Tìm tiểu thương" onClick={() => selectedMarket ? navigate(`/markets/${selectedMarket.id}/traders`) : navigate('/markets')} /></Grid>
            <Grid size={4}><QuickAction icon={<Package size={22} />} label="Sản phẩm" onClick={() => navigate('/products')} /></Grid>
            <Grid size={4}><QuickAction icon={<BadgePercent size={22} />} label="Ưu đãi & Khuyến mãi" onClick={() => navigate('/products?onSale=1')} /></Grid>
            <Grid size={4}><QuickAction icon={<ShoppingCart size={22} />} label="Đơn hàng" onClick={() => navigate('/orders')} /></Grid>
            <Grid size={4}><QuickAction icon={<QrCode size={22} />} label="Thanh toán QR" onClick={() => navigate('/qr')} /></Grid>
            <Grid size={4}><QuickAction icon={<MessageSquareWarning size={22} />} label="Phản ánh" onClick={() => navigate('/feedback')} /></Grid>
          </Grid>
        </Card>
      </Box>

      {!selectedMarket ? (
        <EmptyState
          icon={<MapPin size={40} strokeWidth={1.5} />}
          title="Bạn chưa chọn chợ"
          hint="Chọn một khu chợ để xem tiểu thương và sản phẩm đang bán."
          action={<Box component="button" onClick={() => navigate('/markets')} sx={{ mt: 1, border: 0, bgcolor: 'primary.main', color: '#fff', borderRadius: 3, px: 3, py: 1.25, fontWeight: 600, cursor: 'pointer' }}>Chọn chợ ngay</Box>}
        />
      ) : home.isLoading ? (
        <LoadingScreen height={300} />
      ) : (
        <Screen>
          {!!home.data?.saleProducts?.length && (
            <Box mb={3}>
              <SectionHeader title="🔥 Đang giảm giá" action="Xem tất cả" onAction={() => navigate('/products?onSale=1')} />
              <Grid container spacing={1.25}>
                {home.data.saleProducts.slice(0, 4).map((p) => (
                  <Grid key={p.id} size={6}><ProductCard product={p} /></Grid>
                ))}
              </Grid>
            </Box>
          )}
          {!!home.data?.featuredTraders?.length && (
            <Box mb={3}>
              <SectionHeader title="Tiểu thương nổi bật" action="Xem tất cả" onAction={() => navigate(`/markets/${selectedMarket.id}/traders`)} />
              <Stack gap={1}>
                {home.data.featuredTraders.slice(0, 4).map((s) => <TraderCard key={s.id} stall={s} />)}
              </Stack>
            </Box>
          )}
          {!!home.data?.featuredProducts?.length && (
            <Box mb={2}>
              <SectionHeader title="Sản phẩm nổi bật" action="Xem tất cả" onAction={() => navigate('/products')} />
              <Grid container spacing={1.25}>
                {home.data.featuredProducts.slice(0, 6).map((p) => (
                  <Grid key={p.id} size={6}><ProductCard product={p} /></Grid>
                ))}
              </Grid>
            </Box>
          )}
          {!home.data?.saleProducts?.length && !home.data?.featuredProducts?.length && !home.data?.featuredTraders?.length && (
            <EmptyState title="Chợ này chưa có hàng hóa" hint="Hãy quay lại sau nhé." />
          )}
        </Screen>
      )}
    </Box>
  );
}
