import {
  Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, Fab,
  DialogContentText, DialogTitle, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, FileSearch, PackageOpen, Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDelete, apiGetPaged, apiPatch, errMsg } from '@/services/api';
import { EmptyState, FixedHeader, LoadingScreen, Price, Screen } from '@/components/ui/bits';
import { toast, useDebounce } from '@/hooks';
import type { Product } from '@/types';

const IMG_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23F3F4F6"/></svg>';

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'selling', label: 'Đang bán' },
  { key: 'hidden', label: 'Đang ẩn' },
  { key: 'out_of_stock', label: 'Hết hàng' },
  { key: 'on_sale', label: 'Đang giảm' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

const PAGE_SIZE = 15;

export function SellerProductsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const debounced = useDebounce(search);

  const list = useInfiniteQuery({
    queryKey: ['seller-products', tab, debounced],
    queryFn: ({ pageParam }) =>
      apiGetPaged<Product>('/seller/products', {
        tab,
        search: debounced || undefined,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const products = list.data?.pages.flatMap((p) => p.data) ?? [];
  const total = list.data?.pages[0]?.meta.total ?? 0;

  const visibility = useMutation({
    mutationFn: (p: Product) =>
      apiPatch(`/seller/products/${p.id}/visibility`, { isHidden: !p.isHidden }),
    onSuccess: (_d, p) => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      qc.invalidateQueries({ queryKey: ['seller-dashboard'] });
      toast.success(p.isHidden ? 'Đã hiện lại sản phẩm' : 'Đã ẩn sản phẩm');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/seller/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      qc.invalidateQueries({ queryKey: ['seller-dashboard'] });
      toast.success('Đã xóa sản phẩm');
      setToDelete(null);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Box>
      {/* Header (màn có bottom nav → không nút back) */}
      <FixedHeader
        sx={{
          bgcolor: '#fff',
          borderBottom: '1px solid #EEF0F2', px: 2,
          pt: 'calc(var(--app-safe-area-top) + 12px)', pb: 1.5,
          display: 'flex', alignItems: 'center', gap: 1,
        }}
      >
        <Box flex={1} minWidth={0}>
          <Typography variant="h6" noWrap>Sản phẩm</Typography>
          <Typography variant="caption" color="text.secondary">
            {total > 0 ? `${total} sản phẩm trong sạp` : 'Quản lý hàng hóa của sạp'}
          </Typography>
        </Box>
      </FixedHeader>

      <Screen>
        <TextField
          fullWidth size="small" placeholder="Tìm sản phẩm theo tên..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }}
          sx={{ mb: 1.5 }}
        />

        {/* Tabs cuộn ngang */}
        <Box
          sx={{
            display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 0.5,
            '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
          }}
        >
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <Chip
                key={t.key}
                label={t.label}
                onClick={() => setTab(t.key)}
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                sx={{ flexShrink: 0, fontWeight: active ? 700 : 500 }}
              />
            );
          })}
        </Box>

        {list.isLoading ? (
          <LoadingScreen />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<PackageOpen size={40} strokeWidth={1.5} />}
            title={debounced ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
            hint={debounced ? 'Thử từ khóa khác.' : 'Thêm sản phẩm đầu tiên để bắt đầu bán hàng.'}
          />
        ) : (
          <Stack gap={1.25}>
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                onEdit={() => navigate(`/seller/products/${p.id}/edit`)}
                onPromotion={() => navigate(`/seller/products/${p.id}/promotion`)}
                onToggle={() => visibility.mutate(p)}
                onDelete={() => setToDelete(p)}
                busy={visibility.isPending && visibility.variables?.id === p.id}
              />
            ))}

            {list.hasNextPage && (
              <Button
                variant="outlined" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}
                sx={{ mt: 0.5 }}
              >
                {list.isFetchingNextPage ? <CircularProgress size={20} /> : 'Tải thêm'}
              </Button>
            )}
          </Stack>
        )}
      </Screen>

      <Fab
        color="primary"
        aria-label="Thêm sản phẩm"
        onClick={() => navigate('/seller/products/create')}
        sx={{
          position: 'fixed',
          right: 'max(16px, calc((100vw - 480px) / 2 + 16px))',
          bottom: 'calc(84px + var(--app-safe-area-bottom))',
          zIndex: 25,
          boxShadow: '0 8px 24px rgba(22, 163, 74, 0.3)',
        }}
      >
        <Plus size={26} />
      </Fab>

      {/* Xác nhận xóa */}
      <Dialog open={!!toDelete} onClose={() => (remove.isPending ? undefined : setToDelete(null))} PaperProps={{ sx: { borderRadius: 4, mx: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>Xóa sản phẩm?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sản phẩm “{toDelete?.name}” sẽ bị gỡ khỏi sạp và không còn hiển thị với khách. Bạn chắc chắn chứ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setToDelete(null)} disabled={remove.isPending}>Hủy</Button>
          <Button color="error" variant="contained" onClick={() => toDelete && remove.mutate(toDelete.id)} disabled={remove.isPending}>
            {remove.isPending ? <CircularProgress size={20} color="inherit" /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ProductRow({
  product, onEdit, onPromotion, onToggle, onDelete, busy,
}: {
  product: Product;
  onEdit: () => void;
  onPromotion: () => void;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const out = product.stockStatus === 'out_of_stock';
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack direction="row" gap={1.25} sx={{ p: 1.25 }}>
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Box
            component="img"
            src={product.images?.[0]?.url || IMG_FALLBACK}
            alt={product.name}
            sx={{ width: 76, height: 76, borderRadius: 2.5, objectFit: 'cover', bgcolor: '#F3F4F6', opacity: product.isHidden ? 0.55 : 1 }}
          />
          {product.isHidden && (
            <Chip size="small" color="error" label="Đang ẩn" sx={{ position: 'absolute', bottom: 4, left: 4, height: 20, fontSize: 10 }} />
          )}
        </Box>

        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={600} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </Typography>
          <Stack direction="row" alignItems="baseline" gap={0.5} mt={0.25}>
            <Price price={product.price} finalPrice={product.finalPrice} isOnSale={product.isOnSale} size="sm" />
            <Typography variant="caption" color="text.secondary">/{product.unit}</Typography>
          </Stack>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: out ? 'error.main' : 'text.secondary', fontWeight: out ? 600 : 400 }}>
            {out ? 'Hết hàng' : `Tồn kho: ${product.quantity} ${product.unit}`}
          </Typography>
          {product.hasTraceability && (
            <Stack direction="row" alignItems="center" gap={0.5} mt={0.5} sx={{ color: '#166534' }}>
              <FileSearch size={13} />
              <Typography variant="caption" fontWeight={600}>Có thông tin truy xuất</Typography>
            </Stack>
          )}
        </Box>
      </Stack>

      {/* Thanh hành động */}
      <Stack direction="row" sx={{ borderTop: '1px solid #F1F3F5' }}>
        <RowAction icon={<Pencil size={17} />} label="Sửa" onClick={onEdit} />
        <RowAction icon={<Tag size={17} />} label="Khuyến mãi" onClick={onPromotion} highlight={product.isOnSale} />
        <RowAction
          icon={product.isHidden ? <Eye size={17} /> : <EyeOff size={17} />}
          label={product.isHidden ? 'Hiện' : 'Ẩn'}
          onClick={onToggle}
          disabled={busy}
        />
        <RowAction icon={<Trash2 size={17} />} label="Xóa" onClick={onDelete} danger />
      </Stack>
    </Card>
  );
}

function RowAction({
  icon, label, onClick, danger, highlight, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  highlight?: boolean;
  disabled?: boolean;
}) {
  const color = danger ? 'error.main' : highlight ? 'primary.main' : 'text.secondary';
  return (
    <Box
      component="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      sx={{
        flex: 1, border: 0, bgcolor: 'transparent', cursor: disabled ? 'default' : 'pointer',
        py: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25,
        color, opacity: disabled ? 0.5 : 1,
        borderLeft: '1px solid #F1F3F5', '&:first-of-type': { borderLeft: 0 },
        transition: 'background-color 150ms', '&:active': { bgcolor: '#F9FAFB' },
      }}
    >
      {icon}
      <Box component="span" sx={{ fontSize: 11, fontWeight: 600 }}>{label}</Box>
    </Box>
  );
}
