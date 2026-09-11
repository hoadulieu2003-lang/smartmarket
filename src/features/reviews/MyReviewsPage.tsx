import { Avatar, Box, Button, Card, CircularProgress, Stack, Typography } from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Package, Star } from 'lucide-react';
import { apiGetPaged } from '@/services/api';
import { EmptyState, LoadingScreen, Screen, Stars, TopBar } from '@/components/ui/bits';
import { timeAgo } from '@/utils';
import type { Review } from '@/types';

/** Backend /my/reviews trả quan hệ sản phẩm ở khóa `product`; type dùng `products`. Đọc cả hai cho chắc. */
type ReviewRow = Review & { product?: Review['products'] };

function ReviewItem({ review }: { review: Review }) {
  const product = (review as ReviewRow).product ?? review.products;
  const image = product?.images?.[0]?.url;
  return (
    <Card sx={{ p: 1.5 }}>
      <Stack direction="row" gap={1.25} alignItems="flex-start">
        <Avatar variant="rounded" src={image || undefined} sx={{ width: 52, height: 52, bgcolor: '#F3F4F6', color: 'text.secondary' }}>
          <Package size={22} />
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={700} noWrap>{product?.name ?? 'Sản phẩm'}</Typography>
          <Box my={0.25}>
            <Stars value={review.rating} />
          </Box>
          {review.content && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {review.content}
            </Typography>
          )}
          {!!review.images?.length && (
            <Stack direction="row" gap={0.5} mt={0.75}>
              {review.images.slice(0, 4).map((im, i) => (
                <Box key={i} component="img" src={im.url} alt="" sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover' }} />
              ))}
            </Stack>
          )}
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {timeAgo(review.createdAt)}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

export function MyReviewsPage() {
  const feed = useInfiniteQuery({
    queryKey: ['my-reviews'],
    queryFn: ({ pageParam }) => apiGetPaged<Review>('/my/reviews', { page: pageParam, limit: 15 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });

  const items = feed.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Box>
      <TopBar title="Đánh giá của tôi" onBack />
      {feed.isLoading ? (
        <LoadingScreen height={280} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Star size={40} strokeWidth={1.5} />}
          title="Bạn chưa có đánh giá nào"
          hint="Đánh giá bạn để lại sau khi mua hàng sẽ hiển thị tại đây."
        />
      ) : (
        <Screen>
          <Stack gap={1.25}>
            {items.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
            {feed.hasNextPage && (
              <Button
                variant="text"
                onClick={() => feed.fetchNextPage()}
                disabled={feed.isFetchingNextPage}
                startIcon={feed.isFetchingNextPage ? <CircularProgress size={16} color="inherit" /> : undefined}
                sx={{ alignSelf: 'center', mt: 0.5 }}
              >
                {feed.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
              </Button>
            )}
          </Stack>
        </Screen>
      )}
    </Box>
  );
}
