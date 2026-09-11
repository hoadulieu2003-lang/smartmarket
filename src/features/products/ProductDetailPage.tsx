import { Avatar, Box, Button, Card, Chip, Grid2 as Grid, IconButton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ExternalLink, FileSearch, Minus, Plus, ShoppingCart, Store } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiGetPaged, errMsg } from '@/services/api';
import { ensureZaloContact } from '@/services/zalo';
import { EmptyState, LoadingScreen, Price, Screen, Sheet, Stars, TopBar } from '@/components/ui/bits';
import { ProductCard, SectionHeader } from '@/components/common';
import { toast } from '@/hooks';
import { useAuth, useCart } from '@/stores';
import { formatDate } from '@/utils';
import type { Product, Review } from '@/types';

function TraceabilityRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{value}</Typography>
    </Box>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const name = review.reviewer?.fullName ?? 'Người dùng';
  return (
    <Stack direction="row" gap={1.25}>
      <Avatar src={review.reviewer?.avatar ?? undefined} sx={{ width: 36, height: 36, fontSize: 15 }}>{name.charAt(0)}</Avatar>
      <Box flex={1} minWidth={0}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography variant="body2" fontWeight={600} noWrap>{name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{formatDate(review.createdAt)}</Typography>
        </Stack>
        <Box mt={0.25}><Stars value={review.rating} size={13} /></Box>
        {review.content && <Typography variant="body2" mt={0.5}>{review.content}</Typography>}
        {!!review.images?.length && (
          <Stack direction="row" gap={0.75} mt={0.75} flexWrap="wrap">
            {review.images.slice(0, 4).map((im, i) => (
              <Box key={i} component="img" src={im.url} alt="" sx={{ width: 56, height: 56, borderRadius: 2, objectFit: 'cover' }} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { selectedMarket } = useAuth();
  const addToCart = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);

  const q = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiGet<Product>(`/products/${id}`),
    enabled: !!id,
  });
  const product = q.data;

  const reviews = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: () => apiGetPaged<Review>(`/products/${id}/reviews`, { page: 1, limit: 5 }),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <Box>
        <TopBar title="Chi tiết sản phẩm" onBack />
        <LoadingScreen height={320} />
      </Box>
    );
  }
  if (!product || Array.isArray(product) || !product.id) {
    return (
      <Box>
        <TopBar title="Chi tiết sản phẩm" onBack />
        <EmptyState title="Không tìm thấy sản phẩm" hint="Sản phẩm có thể đã ngừng bán." />
      </Box>
    );
  }

  // API chi tiết trả về `stall` (số ít); danh sách trả `stalls`. Nhận cả hai cho chắc.
  const stall = product.stalls ?? (product as { stall?: Product['stalls'] }).stall;
  const out = product.stockStatus === 'out_of_stock';
  const image = product.images?.[0]?.url;
  const related = product.relatedProducts ?? [];
  const reviewList = reviews.data?.data ?? [];
  const max = Number(product.quantity) || 50;
  const clamp = (n: number) => Math.max(1, Math.min(n, max));

  async function handleAdd() {
    if (!product || Array.isArray(product)) return;
    setAdding(true);
    try {
      await ensureZaloContact();
      addToCart({
        productId: product.id || id,
        stallId: product.stallId || stall?.id || 's-a01',
        marketId: stall?.marketId ?? selectedMarket?.id ?? 'm-dongxuan',
        name: product.name || 'Sản phẩm',
        image: product.images?.[0]?.url ?? null,
        unit: product.unit || 'kg',
        unitPrice: Number(product.finalPrice) || Number(product.price) || 0,
        originalPrice: Number(product.price) || Number(product.finalPrice) || 0,
        quantity: Math.max(1, Number(qty) || 1),
        maxQuantity: Math.max(1, Number(product.quantity) || 50),
        stallCode: stall?.code || 'A-01',
        stallName: stall?.name || 'Sạp Thịt Bò Tươi Cô Mai',
        marketName: stall?.markets?.name || 'Chợ Đồng Xuân',
      });
      toast.success('Đã thêm vào giỏ');
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setAdding(false);
    }
  }

  return (
    <Box sx={{ pb: 'calc(env(safe-area-inset-bottom) + 92px)' }}>
      <TopBar title={product.name} onBack />

      {/* Ảnh sản phẩm */}
      <Box sx={{ aspectRatio: '1', bgcolor: '#F3F4F6', position: 'relative' }}>
        {image ? (
          <Box component="img" src={image} alt={product.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', color: 'text.disabled' }}><Store size={48} strokeWidth={1.5} /></Stack>
        )}
        {product.isOnSale && <Chip color="error" label="Đang giảm giá" sx={{ position: 'absolute', top: 12, left: 12 }} />}
      </Box>

      <Screen pb={0}>
        <Typography variant="h6">{product.name}</Typography>
        <Stack direction="row" alignItems="baseline" gap={1} mt={0.75} flexWrap="wrap">
          <Price price={product.price} finalPrice={product.finalPrice} isOnSale={product.isOnSale} size="lg" />
          <Typography variant="body2" color="text.secondary">/ {product.unit}</Typography>
        </Stack>
        <Stack direction="row" gap={1.5} alignItems="center" mt={1} flexWrap="wrap">
          <Stars value={product.ratingAvg} count={product.reviewCount} />
          {product.origin && <Typography variant="caption" color="text.secondary">Xuất xứ: {product.origin}</Typography>}
          <Chip size="small" variant="outlined" color={out ? 'default' : 'success'} label={out ? 'Hết hàng' : `Còn ${product.quantity} ${product.unit}`} sx={{ height: 22 }} />
        </Stack>

        {product.hasTraceability && product.traceability && (
          <Chip
            icon={<FileSearch size={15} />}
            label="Có thông tin truy xuất nguồn gốc"
            onClick={() => setTraceOpen(true)}
            sx={{
              mt: 1.5, height: 30, cursor: 'pointer',
              bgcolor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC',
              '& .MuiChip-icon': { color: '#15803D' },
            }}
          />
        )}

        {/* Sạp bán */}
        {stall && (
          <Card onClick={() => navigate(`/traders/${stall.id}`)} sx={{ p: 1.5, mt: 2, cursor: 'pointer' }}>
            <Stack direction="row" gap={1.25} alignItems="center">
              <Avatar variant="rounded" src={stall.merchant?.avatar ?? undefined} sx={{ width: 44, height: 44, bgcolor: 'primary.light' }}><Store size={20} /></Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700} noWrap>{stall.name || `Sạp ${stall.code}`}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {stall.merchant?.fullName ? `${stall.merchant.fullName} · ` : ''}{stall.markets?.name ?? stall.code}
                </Typography>
              </Box>
              <ChevronRight size={18} color="#9CA3AF" />
            </Stack>
          </Card>
        )}

        {/* Mô tả */}
        {product.description && (
          <Box mt={2.5}>
            <SectionHeader title="Mô tả sản phẩm" />
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{product.description}</Typography>
          </Box>
        )}

        {/* Đánh giá */}
        <Box mt={2.5}>
          <SectionHeader title={`Đánh giá${product.reviewCount ? ` (${product.reviewCount})` : ''}`} />
          {reviews.isLoading ? (
            <LoadingScreen height={80} />
          ) : reviewList.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Chưa có đánh giá cho sản phẩm này.</Typography>
          ) : (
            <Stack gap={1.5} divider={<Box sx={{ borderTop: '1px solid #EEF0F2' }} />}>
              {reviewList.map((r) => <ReviewRow key={r.id} review={r} />)}
            </Stack>
          )}
        </Box>

        {/* Sản phẩm liên quan */}
        {related.length > 0 && (
          <Box mt={3}>
            <SectionHeader title="Sản phẩm liên quan" />
            <Grid container spacing={1.25}>
              {related.map((p) => <Grid key={p.id} size={6}><ProductCard product={p} /></Grid>)}
            </Grid>
          </Box>
        )}
      </Screen>

      {/* Thanh dưới cố định */}
      <Box
        sx={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, bgcolor: '#fff', borderTop: '1px solid #EEF0F2',
          px: 2, pt: 1.25, pb: 'calc(env(safe-area-inset-bottom) + 12px)', zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}
      >
        {!out && (
          <Stack direction="row" alignItems="center" sx={{ border: '1px solid #E5E7EB', borderRadius: 2.5, flexShrink: 0 }}>
            <IconButton size="small" onClick={() => setQty((n) => clamp(n - 1))} disabled={qty <= 1} aria-label="Giảm số lượng"><Minus size={16} /></IconButton>
            <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{qty}</Typography>
            <IconButton size="small" onClick={() => setQty((n) => clamp(n + 1))} disabled={qty >= max} aria-label="Tăng số lượng"><Plus size={16} /></IconButton>
          </Stack>
        )}
        <Button
          fullWidth variant="contained" size="large" disabled={out || adding}
          startIcon={out ? undefined : <ShoppingCart size={18} />}
          onClick={() => void handleAdd()}
        >
          {out ? 'Hết hàng' : adding ? 'Đang xử lý...' : 'Thêm vào giỏ'}
        </Button>
      </Box>

      <Sheet open={traceOpen} onClose={() => setTraceOpen(false)} title="Thông tin truy xuất nguồn gốc">
        {product.traceability && (
          <Stack gap={2} sx={{ overflowY: 'auto', pb: 1 }}>
            <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <Stack direction="row" gap={1} alignItems="flex-start">
                <FileSearch size={18} color="#15803D" />
                <Typography variant="caption" color="#166534">
                  Thông tin này do tiểu thương tự cung cấp để người mua tham khảo, không phải chứng nhận của ban quản lý chợ.
                </Typography>
              </Stack>
            </Box>

            <TraceabilityRow label="Đơn vị sản xuất/cung cấp" value={product.traceability.producerName} />
            <TraceabilityRow label="Địa chỉ hoặc vùng sản xuất" value={product.traceability.productionAddress} />
            <TraceabilityRow label="Mã lô" value={product.traceability.batchCode} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
              {product.traceability.productionDate && <TraceabilityRow label="Ngày sản xuất" value={formatDate(product.traceability.productionDate)} />}
              {product.traceability.harvestDate && <TraceabilityRow label="Ngày thu hoạch" value={formatDate(product.traceability.harvestDate)} />}
              {product.traceability.expiryDate && <TraceabilityRow label="Hạn sử dụng" value={formatDate(product.traceability.expiryDate)} />}
            </Box>
            <TraceabilityRow label="Tên chứng nhận" value={product.traceability.certificateName} />
            <TraceabilityRow label="Số chứng nhận" value={product.traceability.certificateNumber} />

            {!!product.traceability.documents?.length && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>Ảnh giấy tờ/chứng nhận</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {product.traceability.documents.map((document, index) => (
                    <Box
                      key={document.url}
                      component="a"
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ display: 'block', aspectRatio: '1', borderRadius: 2.5, overflow: 'hidden', border: '1px solid #E5E7EB' }}
                    >
                      <Box component="img" src={document.url} alt={`Giấy tờ nguồn gốc ${index + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {product.traceability.externalUrl && (
              <Button
                component="a"
                href={product.traceability.externalUrl}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                endIcon={<ExternalLink size={16} />}
              >
                Mở trang truy xuất bên ngoài
              </Button>
            )}
            <TraceabilityRow label="Ghi chú bổ sung" value={product.traceability.notes} />
          </Stack>
        )}
      </Sheet>
    </Box>
  );
}
