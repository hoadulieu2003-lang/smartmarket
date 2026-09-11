import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, LocateFixed, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPut, errMsg } from '@/services/api';
import { EmptyState, LoadingScreen, Screen, TopBar } from '@/components/ui/bits';
import { MarketCard } from '@/components/common';
import { toast } from '@/hooks';
import { useDebounce } from '@/hooks';
import { useAuth } from '@/stores';
import type { Market } from '@/types';
import { getNearbyMarketsFromRuntime, isZaloRuntime } from '@/services/zalo';

export function MarketsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { selectedMarket, setSelectedMarket } = useAuth();
  const [search, setSearch] = useState('');
  const [nearby, setNearby] = useState<Market[] | null>(null);
  const [locating, setLocating] = useState(false);
  const debounced = useDebounce(search);

  const list = useQuery({
    queryKey: ['markets', debounced],
    // /markets phân trang: apiGet trả về mảng data trong envelope (bỏ meta).
    queryFn: () => apiGet<Market[]>('/markets', { search: debounced || undefined, limit: 50 }),
  });
  const markets = list.data ?? [];

  const select = useMutation({
    mutationFn: (m: Market) => apiPut('/users/me/selected-market', { marketId: m.id }),
    onSuccess: (_d, m) => {
      setSelectedMarket({ id: m.id, name: m.name });
      qc.invalidateQueries({ queryKey: ['market-home'] });
      toast.success(`Đã chọn ${m.name}`);
      navigate('/');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  async function findNearby() {
    setLocating(true);
    try {
      setNearby(await getNearbyMarketsFromRuntime(10));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLocating(false);
    }
  }

  const shown = nearby ?? markets;

  return (
    <Box>
      <TopBar title="Chọn chợ" subtitle="Chọn khu chợ bạn muốn mua sắm" onBack />
      <Screen pb={4}>
        <Stack direction="row" gap={1} mb={2} alignItems="center">
          <TextField
            fullWidth size="small" placeholder="Tìm chợ theo tên..." value={search}
            onChange={(e) => { setSearch(e.target.value); setNearby(null); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }}
          />
          <Button
            variant="outlined"
            onClick={findNearby}
            disabled={locating}
            sx={{ flexShrink: 0, px: 1.5, height: 40 }}
            startIcon={<LocateFixed size={18} />}
          >
            {locating ? '...' : 'Gần tôi'}
          </Button>
        </Stack>
        {isZaloRuntime() && (
          <Box sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
            Vị trí chỉ được dùng một lần để tìm chợ gần bạn và không được lưu lại.
          </Box>
        )}

        {list.isLoading && !nearby ? (
          <LoadingScreen />
        ) : shown.length === 0 ? (
          <EmptyState title="Không tìm thấy chợ" hint="Thử từ khóa khác hoặc bấm Gần tôi." />
        ) : (
          <Stack gap={1.25}>
            {shown.map((m) => (
              <MarketCard
                key={m.id}
                market={m}
                onClick={() => select.mutate(m)}
                right={selectedMarket?.id === m.id ? <Check size={20} color="#16A34A" /> : undefined}
              />
            ))}
          </Stack>
        )}
      </Screen>
    </Box>
  );
}
