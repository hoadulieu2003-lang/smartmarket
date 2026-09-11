import { Avatar, Box, Button, Card, Chip, Grid2 as Grid, Stack, Typography } from '@mui/material';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Clock, Flag, Phone, Store } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiGetPaged } from '@/services/api';
import { EmptyState, LoadingScreen, Screen, Stars, TopBar } from '@/components/ui/bits';
import { ProductCard, SectionHeader } from '@/components/common';
import type { Product, Stall } from '@/types';

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Box sx={{ color: 'text.secondary', flexShrink: 0, display: 'flex' }}>{icon}</Box>
      <Typography variant="body2" component="div">{children}</Typography>
    </Stack>
  );
}

export function TraderDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ['stall', id],
    queryFn: () => apiGet<Stall>(`/stalls/${id}`),
    enabled: !!id,
  });
  const stall = q.data;

  const prods = useInfiniteQuery({
    queryKey: ['stall-products', id, stall?.marketId],
    queryFn: ({ pageParam }) =>
      apiGetPaged<Product>('/products', { marketId: stall!.marketId, stallId: id, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: !!stall?.marketId,
  });
  const products = prods.data?.pages.flatMap((p) => p.data) ?? [];

  if (q.isLoading) {
    return (
      <Box>
        <TopBar title="Chi tiết sạp" onBack />
        <LoadingScreen height={320} />
      </Box>
    );
  }
  if (!stall) {
    return (
      <Box>
        <TopBar title="Chi tiết sạp" onBack />
        <EmptyState title="Không tìm thấy sạp" hint="Sạp có thể đã ngừng kinh doanh." />
      </Box>
    );
  }

  const title = stall.name || `Sạp ${stall.code}`;
  const cover = stall.images?.[0]?.url || stall.merchant?.avatar || undefined;

  return (
    <Box>
      <TopBar title={title} onBack />
      <Screen pb={4}>
        {/* Thông tin sạp */}
        <Card sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" gap={1.5}>
            <Avatar src={cover} variant="rounded" sx={{ width: 72, height: 72, bgcolor: 'primary.light', fontSize: 28 }}>
              {title.charAt(0)}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="h6" noWrap>{title}</Typography>
              <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap" mt={0.5}>
                <Chip size="small" label={stall.code} variant="outlined" sx={{ height: 22 }} />
                {stall.categories?.name && <Chip size="small" label={stall.categories.name} color="primary" variant="outlined" sx={{ height: 22 }} />}
                {stall.hasPromotion && <Chip size="small" color="error" label="Có KM" sx={{ height: 22 }} />}
              </Stack>
              <Box mt={0.75}><Stars value={stall.ratingAvg} count={stall.reviewCount} /></Box>
            </Box>
          </Stack>

          {stall.merchant?.fullName && (
            <Stack direction="row" gap={1} alignItems="center" mt={1.75}>
              <Avatar src={stall.merchant.avatar ?? undefined} sx={{ width: 28, height: 28, fontSize: 13 }}>{stall.merchant.fullName.charAt(0)}</Avatar>
              <Typography variant="body2" color="text.secondary">
                Tiểu thương: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{stall.merchant.fullName}</Box>
              </Typography>
            </Stack>
          )}

          <Stack gap={0.75} mt={1.5}>
            {stall.openHours && <InfoRow icon={<Clock size={16} />}>{stall.openHours}</InfoRow>}
            {stall.phone && (
              <InfoRow icon={<Phone size={16} />}>
                <Box component="a" href={`tel:${stall.phone}`} sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 500 }}>{stall.phone}</Box>
              </InfoRow>
            )}
          </Stack>

          <Button
            fullWidth variant="outlined" color="error" startIcon={<Flag size={16} />} sx={{ mt: 2 }}
            onClick={() => navigate(`/feedback/create?stallId=${id}&marketId=${stall.marketId}`)}
          >
            Gửi phản ánh
          </Button>
        </Card>

        {stall.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, whiteSpace: 'pre-line' }}>{stall.description}</Typography>
        )}

        {/* Sản phẩm của sạp */}
        <SectionHeader title="Sản phẩm của sạp" />
        {prods.isLoading ? (
          <LoadingScreen />
        ) : products.length === 0 ? (
          <EmptyState icon={<Store size={40} strokeWidth={1.5} />} title="Sạp chưa có sản phẩm" hint="Hãy quay lại sau nhé." />
        ) : (
          <>
            <Grid container spacing={1.25}>
              {products.map((p) => <Grid key={p.id} size={6}><ProductCard product={p} /></Grid>)}
            </Grid>
            {prods.hasNextPage && (
              <Button fullWidth variant="outlined" onClick={() => prods.fetchNextPage()} disabled={prods.isFetchingNextPage} sx={{ mt: 2 }}>
                {prods.isFetchingNextPage ? 'Đang tải...' : 'Xem thêm'}
              </Button>
            )}
          </>
        )}
      </Screen>
    </Box>
  );
}
