import { Box, Button, Card, Fab, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetPaged } from '@/services/api';
import { EmptyState, FixedHeader, LoadingScreen, Screen, StatusChip, TopBar } from '@/components/ui/bits';
import { COMPLAINT_STATUS, COMPLAINT_TYPE, timeAgo, truncate } from '@/utils';
import type { Complaint, ComplaintStatus } from '@/types';

type TabValue = '' | Extract<ComplaintStatus, 'processing' | 'resolved'>;
const TABS: { value: TabValue; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
];

export function FeedbackListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>('');

  const q = useInfiniteQuery({
    queryKey: ['my-complaints', tab],
    queryFn: ({ pageParam }) =>
      apiGetPaged<Complaint>('/my/complaints', { status: tab || undefined, page: pageParam, limit: 15 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });

  const items = q.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Box>
      <TopBar title="Phản ánh của tôi" onBack />

      <FixedHeader sx={{ top: 'var(--app-topbar-height)', zIndex: 29, bgcolor: '#fff', borderBottom: '1px solid #EEF0F2' }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth">
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} sx={{ minHeight: 44, textTransform: 'none' }} />
          ))}
        </Tabs>
      </FixedHeader>

      <Screen>
        {q.isLoading ? (
          <LoadingScreen />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có phản ánh nào"
            hint="Khi bạn gửi phản ánh về chợ, sạp hay sản phẩm, chúng sẽ hiển thị ở đây."
          />
        ) : (
          <Stack gap={1.25}>
            {items.map((c) => (
              <ComplaintCard key={c.id} complaint={c} onClick={() => navigate(`/feedback/${c.id}`)} />
            ))}
            {q.hasNextPage && (
              <Button
                variant="text" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}
                sx={{ alignSelf: 'center', mt: 0.5 }}
              >
                {q.isFetchingNextPage ? 'Đang tải...' : 'Xem thêm'}
              </Button>
            )}
          </Stack>
        )}
      </Screen>

      <Fab
        variant="extended" color="primary" onClick={() => navigate('/feedback/create')}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 20, textTransform: 'none', fontWeight: 600 }}
      >
        <Plus size={20} style={{ marginRight: 6 }} /> Gửi phản ánh
      </Fab>
    </Box>
  );
}

function ComplaintCard({ complaint, onClick }: { complaint: Complaint; onClick: () => void }) {
  const place = [complaint.markets?.name, complaint.stalls && (complaint.stalls.name || `Sạp ${complaint.stalls.code}`)]
    .filter(Boolean)
    .join(' · ');
  const status = COMPLAINT_STATUS[complaint.status];
  return (
    <Card onClick={onClick} sx={{ cursor: 'pointer', p: 1.5 }}>
      <Stack direction="row" alignItems="flex-start" gap={1} mb={0.5}>
        <Typography variant="subtitle2" flex={1} minWidth={0}>{COMPLAINT_TYPE[complaint.type]}</Typography>
        <StatusChip label={status.label} tone={status.tone} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {truncate(complaint.content, 140)}
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} mt={0.75}>
        <Typography variant="caption" color="text.secondary" noWrap>{place || 'Phản ánh chung'}</Typography>
        <Typography variant="caption" color="text.secondary" flexShrink={0}>{timeAgo(complaint.createdAt)}</Typography>
      </Stack>
    </Card>
  );
}
