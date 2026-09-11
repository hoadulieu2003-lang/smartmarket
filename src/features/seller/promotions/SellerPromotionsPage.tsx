import { Box, Button, Card, Chip, Stack, Typography } from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRight, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGetPaged } from '@/services/api';
import { EmptyState, ErrorState, FixedHeader, LoadingScreen, Price, Screen } from '@/components/ui/bits';
import type { Product } from '@/types';

const IMG_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23F3F4F6"/></svg>';

function discountLabel(p: Product): string {
  if (p.discountType === 'percent') return `Giảm ${p.discountValue ?? 0}%`;
  if (p.discountType === 'fixed_price') return 'Giá ưu đãi';
  return 'Khuyến mãi';
}

export function SellerPromotionsPage() {
  const navigate = useNavigate();

  const q = useInfiniteQuery({
    queryKey: ['seller-promotions'],
    queryFn: ({ pageParam }) => apiGetPaged<Product>('/seller/products', { tab: 'on_sale', page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
  const products = q.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Box>
      {/* Header xanh */}
      <FixedHeader sx={{ bgcolor: 'primary.main', color: '#fff', pt: 'calc(var(--app-safe-area-top) + 16px)', pb: 2, px: 2, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Khuyến mãi</Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>Sản phẩm đang giảm giá</Typography>
      </FixedHeader>

      {q.isLoading ? (
        <LoadingScreen height={280} />
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Tag size={40} strokeWidth={1.5} />}
          title="Chưa có khuyến mãi"
          hint="Vào mục Sản phẩm và tạo khuyến mãi cho từng sản phẩm để thu hút khách hàng."
          action={
            <Button variant="contained" sx={{ mt: 1 }} onClick={() => navigate('/seller/products')}>
              Đi tới Sản phẩm
            </Button>
          }
        />
      ) : (
        <Screen>
          <Stack gap={1.25}>
            {products.map((p) => (
              <Card key={p.id} onClick={() => navigate(`/seller/products/${p.id}/promotion`)} sx={{ p: 1.25, cursor: 'pointer' }}>
                <Stack direction="row" gap={1.25} alignItems="center">
                  <Box component="img" src={p.images?.[0]?.url || IMG_FALLBACK} alt={p.name} sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover', bgcolor: '#F3F4F6', flexShrink: 0 }} />
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                    <Box my={0.25}><Price price={p.price} finalPrice={p.finalPrice} isOnSale={p.isOnSale} size="sm" /></Box>
                    <Stack direction="row" gap={0.75} alignItems="center">
                      <Chip size="small" color="error" variant="outlined" label={discountLabel(p)} sx={{ height: 22 }} />
                      <Typography variant="caption" color="text.secondary">/{p.unit}</Typography>
                    </Stack>
                  </Box>
                  <ChevronRight size={18} color="#9CA3AF" />
                </Stack>
              </Card>
            ))}
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
