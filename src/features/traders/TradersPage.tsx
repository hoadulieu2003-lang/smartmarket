import { Box, Button, Chip, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Search, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGetPaged } from '@/services/api';
import { EmptyState, LoadingScreen, Screen, Sheet, TopBar } from '@/components/ui/bits';
import { TraderCard } from '@/components/common';
import { useCategories, useDebounce } from '@/hooks';
import type { Stall } from '@/types';

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

export function TradersPage() {
  const { id = '' } = useParams();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [hasPromotion, setHasPromotion] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const debounced = useDebounce(search);
  const cats = useCategories();
  const catName = useMemo(() => cats.data?.find((c) => c.id === categoryId)?.name, [cats.data, categoryId]);

  const q = useInfiniteQuery({
    queryKey: ['traders', id, debounced, categoryId, hasPromotion],
    queryFn: ({ pageParam }) =>
      apiGetPaged<Stall>(`/markets/${id}/traders`, {
        page: pageParam,
        limit: 20,
        search: debounced || undefined,
        categoryId,
        hasPromotion: hasPromotion || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: !!id,
  });
  const stalls = q.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Box>
      <TopBar title="Tiểu thương" subtitle="Các sạp đang kinh doanh" onBack />
      <Screen pb={4}>
        {/* Bộ lọc */}
        <TextField
          fullWidth placeholder="Tìm theo tên hoặc mã sạp..." value={search}
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
            label="Có khuyến mãi" onClick={() => setHasPromotion((v) => !v)}
            color={hasPromotion ? 'error' : 'default'} variant={hasPromotion ? 'filled' : 'outlined'}
            sx={{ flexShrink: 0 }}
          />
        </Stack>

        {q.isLoading ? (
          <LoadingScreen />
        ) : stalls.length === 0 ? (
          <EmptyState title="Không có tiểu thương" hint="Thử bỏ bớt bộ lọc hoặc dùng từ khóa khác." />
        ) : (
          <>
            <Stack gap={1}>
              {stalls.map((s) => <TraderCard key={s.id} stall={s} />)}
            </Stack>
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
    </Box>
  );
}
