import { Box, Button, Grid2 as Grid, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, SearchX, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetPaged } from '@/services/api';
import { EmptyState, FixedHeader, LoadingScreen, Screen } from '@/components/ui/bits';
import { ProductCard, SectionHeader, TraderCard } from '@/components/common';
import { useDebounce } from '@/hooks';
import { useAuth } from '@/stores';
import type { Product, Stall } from '@/types';

export function SearchPage() {
  const navigate = useNavigate();
  const selectedMarket = useAuth((s) => s.selectedMarket);
  const [term, setTerm] = useState('');
  const keyword = useDebounce(term.trim());
  const enabled = !!selectedMarket && keyword.length >= 2;

  const products = useQuery({
    queryKey: ['search-products', selectedMarket?.id, keyword],
    queryFn: () => apiGetPaged<Product>('/products', { marketId: selectedMarket!.id, search: keyword, limit: 20 }),
    enabled,
  });
  const traders = useQuery({
    queryKey: ['search-traders', selectedMarket?.id, keyword],
    queryFn: () => apiGetPaged<Stall>(`/markets/${selectedMarket!.id}/traders`, { search: keyword, limit: 10 }),
    enabled,
  });

  const productList = products.data?.data ?? [];
  const traderList = traders.data?.data ?? [];
  const loading = enabled && (products.isLoading || traders.isLoading);
  const noResult = enabled && !loading && productList.length === 0 && traderList.length === 0;

  return (
    <Box>
      {/* Tiêu đề + ô tìm kiếm (trang có bottom nav) */}
      <FixedHeader
        sx={{
          bgcolor: '#fff',
          borderBottom: '1px solid #EEF0F2', px: 2, pb: 1.5,
          pt: 'calc(var(--app-safe-area-top) + 12px)',
        }}
      >
        <Typography variant="h6" fontWeight={700} mb={selectedMarket ? 1.5 : 0}>Tìm kiếm</Typography>
        {selectedMarket && (
          <TextField
            fullWidth
            size="small"
            autoFocus
            placeholder="Tìm sản phẩm, tiểu thương..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search size={18} /></InputAdornment>
              ),
              endAdornment: term ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setTerm('')} aria-label="Xóa từ khóa"><X size={16} /></IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
        )}
      </FixedHeader>

      {!selectedMarket ? (
        <Screen>
          <EmptyState
            icon={<MapPin size={40} strokeWidth={1.5} />}
            title="Bạn chưa chọn chợ"
            hint="Chọn một khu chợ để tìm sản phẩm và tiểu thương đang bán."
            action={
              <Button variant="contained" onClick={() => navigate('/markets')} sx={{ mt: 1 }}>Chọn chợ</Button>
            }
          />
        </Screen>
      ) : keyword.length < 2 ? (
        <Screen>
          <EmptyState
            icon={<Search size={40} strokeWidth={1.5} />}
            title="Nhập từ khóa để tìm"
            hint={`Tìm trong ${selectedMarket.name} — nhập ít nhất 2 ký tự.`}
          />
        </Screen>
      ) : loading ? (
        <LoadingScreen height={280} />
      ) : noResult ? (
        <Screen>
          <EmptyState
            icon={<SearchX size={40} strokeWidth={1.5} />}
            title="Không tìm thấy kết quả"
            hint={`Không có kết quả phù hợp cho "${keyword}".`}
          />
        </Screen>
      ) : (
        <Screen>
          {traderList.length > 0 && (
            <Box mb={3}>
              <SectionHeader title="Tiểu thương" />
              <Stack gap={1}>
                {traderList.map((s) => (
                  <TraderCard key={s.id} stall={s} />
                ))}
              </Stack>
            </Box>
          )}
          {productList.length > 0 && (
            <Box>
              <SectionHeader title="Sản phẩm" />
              <Grid container spacing={1.25}>
                {productList.map((p) => (
                  <Grid key={p.id} size={6}><ProductCard product={p} /></Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Screen>
      )}
    </Box>
  );
}
