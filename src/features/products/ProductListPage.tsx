import { Box, Button, Chip, Grid2 as Grid, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowUpDown, Check, ChevronDown, MapPin, Search, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiGetPaged } from '@/services/api';
import { EmptyState, LoadingScreen, Screen, Sheet, TopBar } from '@/components/ui/bits';
import { ProductCard } from '@/components/common';
import { useCategories, useDebounce } from '@/hooks';
import { useAuth } from '@/stores';
import type { Product } from '@/types';

const SORTS = [
  { key: 'newest', label: 'Mới nhất', sort: 'newest', order: 'desc' },
  { key: 'price_asc', label: 'Giá thấp đến cao', sort: 'price', order: 'asc' },
  { key: 'price_desc', label: 'Giá cao đến thấp', sort: 'price', order: 'desc' },
  { key: 'rating', label: 'Đánh giá cao nhất', sort: 'rating', order: 'desc' },
] as const;
type SortKey = (typeof SORTS)[number]['key'];

function SheetOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      component="button" onClick={onClick}
      sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1, py: 1.25, px: 0.5, width: '100%', textAlign: 'left' }}
    >
      <Typography variant="body2" flex={1} fontWeight={active ? 700 : 400} color={active ? 'primary.main' : 'text.primary'}>{label}</Typography>
      {active && <Check size={18} color="#16A34A" />}
    </Box>
  );
}

export function ProductListPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { selectedMarket } = useAuth();
  const marketId = selectedMarket?.id;
  const stallId = params.get('stallId') ?? undefined;

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(params.get('categoryId') ?? undefined);
  const [onSale, setOnSale] = useState(params.get('onSale') === '1' || params.get('onSale') === 'true');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [catOpen, setCatOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const debounced = useDebounce(search);
  const cats = useCategories();
  const catName = useMemo(() => cats.data?.find((c) => c.id === categoryId)?.name, [cats.data, categoryId]);
  const sortOpt = SORTS.find((s) => s.key === sortKey) ?? SORTS[0];

  const q = useInfiniteQuery({
    queryKey: ['products', marketId, debounced, categoryId, stallId, onSale, sortKey],
    queryFn: ({ pageParam }) =>
      apiGetPaged<Product>('/products', {
        marketId,
        categoryId,
        stallId,
        search: debounced || undefined,
        onSale: onSale || undefined,
        sort: sortOpt.sort,
        order: sortOpt.order,
        page: pageParam,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: !!marketId,
  });
  const products = q.data?.pages.flatMap((p) => p.data) ?? [];

  if (!marketId) {
    return (
      <Box>
        <TopBar title="Sản phẩm" onBack />
        <EmptyState
          icon={<MapPin size={40} strokeWidth={1.5} />}
          title="Bạn chưa chọn chợ"
          hint="Chọn một khu chợ để xem sản phẩm đang bán."
          action={<Button variant="contained" onClick={() => navigate('/markets')} sx={{ mt: 1 }}>Chọn chợ ngay</Button>}
        />
      </Box>
    );
  }

  return (
    <Box>
      <TopBar title="Sản phẩm" subtitle={selectedMarket?.name} onBack />
      <Screen pb={4}>
        {/* Bộ lọc */}
        <TextField
          fullWidth placeholder="Tìm sản phẩm..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }}
          sx={{ mb: 1.25 }}
        />
        <Stack direction="row" gap={1} mb={2} sx={{ overflowX: 'auto', pb: 0.5 }}>
          <Chip
            icon={<Tag size={15} />}
            label={<Stack component="span" direction="row" alignItems="center" gap={0.25}>{catName ?? 'Ngành hàng'}<ChevronDown size={14} /></Stack>}
            onClick={() => setCatOpen(true)}
            color={categoryId ? 'primary' : 'default'} variant={categoryId ? 'filled' : 'outlined'}
            sx={{ flexShrink: 0 }}
          />
          <Chip
            icon={<ArrowUpDown size={14} />}
            label={<Stack component="span" direction="row" alignItems="center" gap={0.25}>{sortOpt.label}<ChevronDown size={14} /></Stack>}
            onClick={() => setSortOpen(true)} variant="outlined"
            sx={{ flexShrink: 0 }}
          />
          <Chip
            label="Đang giảm" onClick={() => setOnSale((v) => !v)}
            color={onSale ? 'error' : 'default'} variant={onSale ? 'filled' : 'outlined'}
            sx={{ flexShrink: 0 }}
          />
        </Stack>

        {q.isLoading ? (
          <LoadingScreen />
        ) : products.length === 0 ? (
          <EmptyState title="Không có sản phẩm" hint="Thử bỏ bớt bộ lọc hoặc dùng từ khóa khác." />
        ) : (
          <>
            <Grid container spacing={1.25}>
              {products.map((p) => <Grid key={p.id} size={6}><ProductCard product={p} /></Grid>)}
            </Grid>
            {q.hasNextPage && (
              <Button fullWidth variant="outlined" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} sx={{ mt: 2 }}>
                {q.isFetchingNextPage ? 'Đang tải...' : 'Xem thêm'}
              </Button>
            )}
          </>
        )}
      </Screen>

      <Sheet open={catOpen} onClose={() => setCatOpen(false)} title="Chọn ngành hàng">
        <Stack>
          <SheetOption label="Tất cả ngành hàng" active={!categoryId} onClick={() => { setCategoryId(undefined); setCatOpen(false); }} />
          {(cats.data ?? []).map((c) => (
            <SheetOption key={c.id} label={c.name} active={categoryId === c.id} onClick={() => { setCategoryId(c.id); setCatOpen(false); }} />
          ))}
        </Stack>
      </Sheet>
      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sắp xếp">
        <Stack>
          {SORTS.map((s) => (
            <SheetOption key={s.key} label={s.label} active={sortKey === s.key} onClick={() => { setSortKey(s.key); setSortOpen(false); }} />
          ))}
        </Stack>
      </Sheet>
    </Box>
  );
}
