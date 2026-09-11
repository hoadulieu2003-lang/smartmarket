import { Avatar, Box, Card, Chip, Stack, Typography } from '@mui/material';
import { ChevronRight, FileSearch, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Price, Stars } from '@/components/ui/bits';
import type { Market, Product, Stall } from '@/types';

const IMG_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23F3F4F6"/></svg>';

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Stack direction="row" alignItems="center" mb={1.25}>
      <Typography variant="subtitle1" flex={1}>{title}</Typography>
      {action && (
        <Box component="button" onClick={onAction} sx={{ border: 0, bgcolor: 'transparent', color: 'primary.main', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          {action} <ChevronRight size={16} />
        </Box>
      )}
    </Stack>
  );
}

/** Card sản phẩm (grid dọc). */
export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const out = product.stockStatus === 'out_of_stock';
  return (
    <Card onClick={() => navigate(`/products/${product.id}`)} sx={{ cursor: 'pointer', overflow: 'hidden', height: '100%' }}>
      <Box sx={{ position: 'relative', aspectRatio: '1', bgcolor: '#F3F4F6' }}>
        <Box component="img" src={product.images?.[0]?.url || IMG_FALLBACK} alt={product.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {product.isOnSale && <Chip size="small" color="error" label="Giảm giá" sx={{ position: 'absolute', top: 6, left: 6, height: 22 }} />}
        {product.hasTraceability && (
          <Chip
            size="small"
            icon={<FileSearch size={13} />}
            label="Có truy xuất"
            sx={{
              position: 'absolute', top: product.isOnSale ? 32 : 6, right: 6, height: 22,
              bgcolor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC',
              '& .MuiChip-icon': { color: '#15803D' },
            }}
          />
        )}
        {out && <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Chip size="small" label="Hết hàng" /></Box>}
      </Box>
      <Box sx={{ p: 1.25 }}>
        <Typography variant="body2" fontWeight={600} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
          {product.name}
        </Typography>
        <Box mt={0.5}>
          <Price price={product.price} finalPrice={product.finalPrice} isOnSale={product.isOnSale} size="sm" />
        </Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.25}>
          <Typography variant="caption" color="text.secondary">/{product.unit}</Typography>
          {!!product.reviewCount && <Stars value={product.ratingAvg} size={12} />}
        </Stack>
      </Box>
    </Card>
  );
}

/** Card tiểu thương / sạp (ngang). */
export function TraderCard({ stall }: { stall: Stall }) {
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate(`/traders/${stall.id}`)} sx={{ cursor: 'pointer', p: 1.25 }}>
      <Stack direction="row" gap={1.25} alignItems="center">
        <Avatar src={stall.images?.[0]?.url || stall.merchant?.avatar || undefined} variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}>
          {(stall.name || stall.code)[0]}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={700} noWrap>{stall.name || `Sạp ${stall.code}`}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {stall.categories?.name ?? 'Kinh doanh tổng hợp'} · {stall.code}
          </Typography>
          <Stack direction="row" gap={1.5} mt={0.25} alignItems="center">
            {stall.ratingAvg ? <Stars value={stall.ratingAvg} count={stall.reviewCount} size={12} /> : <Typography variant="caption" color="text.secondary">Mới</Typography>}
            {!!stall.productCount && <Typography variant="caption" color="text.secondary">{stall.productCount} sản phẩm</Typography>}
          </Stack>
        </Box>
        {stall.hasPromotion && <Chip size="small" color="error" variant="outlined" label="Có KM" sx={{ height: 22 }} />}
      </Stack>
    </Card>
  );
}

/** Card chợ. */
export function MarketCard({ market, onClick, right }: { market: Market; onClick?: () => void; right?: ReactNode }) {
  return (
    <Card onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default', p: 1.5 }}>
      <Stack direction="row" gap={1.25} alignItems="center">
        <Avatar src={market.images?.[0]?.url || undefined} variant="rounded" sx={{ width: 52, height: 52, bgcolor: 'primary.light' }}>
          <MapPin size={22} />
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={700} noWrap>{market.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">{market.address}</Typography>
          <Stack direction="row" gap={1.5} mt={0.25}>
            {market.distanceKm !== undefined && <Typography variant="caption" color="primary.main" fontWeight={600}>{market.distanceKm.toFixed(1)} km</Typography>}
            {!!market.traderCount && <Typography variant="caption" color="text.secondary">{market.traderCount} tiểu thương</Typography>}
          </Stack>
        </Box>
        {right}
      </Stack>
    </Card>
  );
}
