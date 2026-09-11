import { Box, Button, Card, Chip, Divider, Grid2 as Grid, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, MapPin, Package, Phone, Star, Store, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPut, errMsg } from '@/services/api';
import { EmptyState, LoadingScreen, Screen, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { useAuth } from '@/stores';
import type { Market } from '@/types';

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <Stack alignItems="center" gap={0.5} flex={1}>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={700} lineHeight={1}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Stack>
  );
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" gap={1.25} alignItems="flex-start">
      <Box sx={{ color: 'text.secondary', mt: '2px', flexShrink: 0 }}>{icon}</Box>
      <Typography variant="body2" component="div">{children}</Typography>
    </Stack>
  );
}

export function MarketDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { selectedMarket, setSelectedMarket } = useAuth();

  const q = useQuery({
    queryKey: ['market', id],
    queryFn: () => apiGet<Market>(`/markets/${id}`),
    enabled: !!id,
  });
  const market = q.data;
  const isCurrent = !!selectedMarket && selectedMarket.id === id;

  const select = useMutation({
    mutationFn: () => apiPut('/users/me/selected-market', { marketId: id }),
    onSuccess: () => {
      if (market) setSelectedMarket({ id, name: market.name });
      qc.invalidateQueries({ queryKey: ['market-home'] });
      toast.success(`Đã chọn ${market?.name ?? 'chợ'}`);
      navigate('/');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (q.isLoading) {
    return (
      <Box>
        <TopBar title="Chi tiết chợ" onBack />
        <LoadingScreen height={320} />
      </Box>
    );
  }
  if (!market) {
    return (
      <Box>
        <TopBar title="Chi tiết chợ" onBack />
        <EmptyState
          title="Không tìm thấy chợ"
          hint="Chợ có thể đã ngừng hoạt động."
          action={<Button variant="outlined" onClick={() => navigate('/markets')} sx={{ mt: 1 }}>Về danh sách chợ</Button>}
        />
      </Box>
    );
  }

  const cover = market.images?.[0]?.url;

  return (
    <Box>
      <TopBar title={market.name} onBack />

      {/* Hero: ảnh chợ + tên phủ trên nền tối */}
      <Box sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: 'primary.light' }}>
        {cover ? (
          <Box component="img" src={cover} alt={market.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', color: '#fff' }}>
            <Store size={48} strokeWidth={1.5} />
          </Stack>
        )}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0) 55%)' }} />
        {isCurrent && (
          <Chip size="small" color="primary" icon={<Check size={14} />} label="Đang mua tại đây" sx={{ position: 'absolute', top: 12, right: 12 }} />
        )}
        <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
          <Typography variant="h6" sx={{ color: '#fff' }} noWrap>{market.name}</Typography>
          <Stack direction="row" gap={0.5} alignItems="center" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            <MapPin size={14} style={{ flexShrink: 0 }} />
            <Typography variant="caption" noWrap>{market.address}</Typography>
          </Stack>
        </Box>
      </Box>

      <Screen pb={4}>
        {/* Thống kê */}
        <Card sx={{ p: 1.75, mb: 2 }}>
          <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
            <Stat icon={<Store size={20} />} value={String(market.stallCount ?? 0)} label="Sạp" />
            <Stat icon={<Users size={20} />} value={String(market.traderCount ?? 0)} label="Tiểu thương" />
            <Stat icon={<Star size={20} />} value={market.ratingAvg ? market.ratingAvg.toFixed(1) : '—'} label="Đánh giá" />
          </Stack>
        </Card>

        {/* Thông tin */}
        <Stack gap={1.5} mb={2.5}>
          {market.openHours && <InfoRow icon={<Clock size={18} />}>{market.openHours}</InfoRow>}
          <InfoRow icon={<MapPin size={18} />}>{market.address}</InfoRow>
          {market.phone && (
            <InfoRow icon={<Phone size={18} />}>
              <Box component="a" href={`tel:${market.phone}`} sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 500 }}>{market.phone}</Box>
            </InfoRow>
          )}
          {market.description && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mt: 0.5 }}>{market.description}</Typography>
          )}
        </Stack>

        {/* Hành động chính */}
        <Button
          fullWidth variant={isCurrent ? 'outlined' : 'contained'} size="large"
          onClick={() => (isCurrent ? navigate('/') : select.mutate())}
          disabled={select.isPending}
          startIcon={isCurrent ? <Check size={18} /> : undefined}
          sx={{ mb: 1.5 }}
        >
          {isCurrent ? 'Bạn đang mua tại đây' : select.isPending ? 'Đang chọn...' : 'Chọn chợ này'}
        </Button>

        {/* Điều hướng */}
        <Grid container spacing={1.25}>
          <Grid size={6}>
            <Button
              fullWidth variant="outlined"
              onClick={() => navigate(`/markets/${id}/traders`)}
              startIcon={<Store size={18} color="#16A34A" />}
              sx={{ borderColor: 'divider', color: 'text.primary' }}
            >
              Tiểu thương
            </Button>
          </Grid>
          <Grid size={6}>
            <Button
              fullWidth variant="outlined"
              onClick={() => navigate('/products')}
              startIcon={<Package size={18} color="#16A34A" />}
              sx={{ borderColor: 'divider', color: 'text.primary' }}
            >
              Sản phẩm
            </Button>
          </Grid>
        </Grid>
      </Screen>
    </Box>
  );
}
