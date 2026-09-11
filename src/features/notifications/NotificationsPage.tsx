import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, BadgePercent, Bell, BellOff, CheckCheck, Download, FileArchive,
  File as FileIcon, FileText, Image as ImageIcon, MessageSquareWarning, ShoppingBag,
  Store, Wallet, Wrench,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetPaged, apiPost, errMsg } from '@/services/api';
import { EmptyState, FixedHeader, LoadingScreen } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { timeAgo } from '@/utils';
import type { AppNotification } from '@/types';

/** Icon + màu theo loại thông báo (dùng cho avatar nhỏ). */
const TYPE_STYLE: Record<string, { icon: ReactNode; color: string }> = {
  order: { icon: <ShoppingBag size={18} />, color: '#2563EB' },
  complaint: { icon: <MessageSquareWarning size={18} />, color: '#F59E0B' },
  application: { icon: <Store size={18} />, color: '#16A34A' },
  promotion: { icon: <BadgePercent size={18} />, color: '#8B5CF6' },
  fee: { icon: <Wallet size={18} />, color: '#D97706' },
  maintenance: { icon: <Wrench size={18} />, color: '#64748B' },
  urgent: { icon: <AlertTriangle size={18} />, color: '#EF4444' },
  general: { icon: <Bell size={18} />, color: '#64748B' },
};
const styleOf = (n: AppNotification) => TYPE_STYLE[n.type] ?? TYPE_STYLE.general!;

function refTarget(n: AppNotification): string | null {
  switch (n.refType) {
    case 'order': return n.refId ? `/orders/${n.refId}` : null;
    case 'complaint': return n.refId ? `/feedback/${n.refId}` : null;
    case 'merchant_application':
    case 'application': return '/merchant-apply/status';
    default: return null;
  }
}

/** Suy ra tên + icon + màu của tệp đính kèm từ URL. */
function attachmentMeta(url: string): { name: string; tint: string; icon: ReactNode } {
  const clean = url.split('?')[0] ?? url;
  const name = decodeURIComponent(clean.split('/').pop() || 'Tệp đính kèm');
  const ext = name.includes('.') ? (name.split('.').pop()?.toLowerCase() ?? '') : '';
  if (ext === 'pdf') return { name, tint: '#EF4444', icon: <FileText size={18} /> };
  if (['zip', 'rar', '7z'].includes(ext)) return { name, tint: '#2563EB', icon: <FileArchive size={18} /> };
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return { name, tint: '#16A34A', icon: <ImageIcon size={18} /> };
  return { name, tint: '#64748B', icon: <FileIcon size={18} /> };
}

function AttachmentCard({ url }: { url: string }) {
  const m = attachmentMeta(url);
  return (
    <Box
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      sx={{
        mt: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1.25,
        p: 1, borderRadius: 2, border: '1px solid #EDEFF2', bgcolor: '#FBFCFD',
      }}
    >
      <Box sx={{ width: 34, height: 34, borderRadius: 1.5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${m.tint}14`, color: m.tint }}>
        {m.icon}
      </Box>
      <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {m.name}
      </Typography>
      <Download size={16} color="#9AA0A6" />
    </Box>
  );
}

function NotificationItem({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  const s = styleOf(n);
  const urgent = n.priority === 'urgent';
  const important = n.priority === 'important';
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(n)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(n); } }}
      sx={{
        cursor: 'pointer', display: 'flex', gap: 1.5, alignItems: 'flex-start',
        py: 1.75, px: 0.5, borderRadius: 2, transition: 'background-color .15s',
        '&:active': { bgcolor: '#F7F8FA' },
      }}
    >
      {/* Avatar loại + chấm chưa đọc */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${s.color}14`, color: s.color }}>
          {s.icon}
        </Box>
        {!n.isRead && (
          <Box sx={{ position: 'absolute', top: -1, right: -1, width: 11, height: 11, borderRadius: '50%', border: '2px solid #fff', bgcolor: urgent ? '#EF4444' : 'primary.main' }} />
        )}
      </Box>

      <Box flex={1} minWidth={0}>
        <Stack direction="row" alignItems="flex-start" gap={0.75}>
          <Typography variant="body2" sx={{ flex: 1, fontWeight: n.isRead ? 500 : 700, color: 'text.primary', lineHeight: 1.35 }}>
            {n.title}
          </Typography>
          {(urgent || important) && (
            <Box component="span" sx={{ flexShrink: 0, mt: '2px', fontSize: 10, fontWeight: 700, px: 0.75, py: '1px', borderRadius: 1, bgcolor: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.12)', color: urgent ? '#DC2626' : '#B45309' }}>
              {urgent ? 'Khẩn' : 'Quan trọng'}
            </Box>
          )}
        </Stack>
        {n.content && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {n.content}
          </Typography>
        )}
        {n.attachment && <AttachmentCard url={n.attachment} />}
        <Typography variant="caption" color="text.disabled" display="block" mt={0.75}>
          {timeAgo(n.sentAt)}
        </Typography>
      </Box>
    </Box>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const feed = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => apiGetPaged<AppNotification>('/notifications', { page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.page && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });

  const items = feed.data?.pages.flatMap((p) => p.data) ?? [];
  const unreadCount = items.filter((n) => !n.isRead).length;
  const shown = tab === 'unread' ? items.filter((n) => !n.isRead) : items;

  const markRead = useMutation({
    mutationFn: (id: string) => apiPost(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const readAll = useMutation({
    mutationFn: () => apiPost('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đánh dấu tất cả đã đọc');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  function openNoti(n: AppNotification) {
    if (!n.isRead) markRead.mutate(n.id);
    const target = refTarget(n);
    if (target) navigate(target);
  }

  const TABS = [['all', 'Tất cả'], ['unread', 'Chưa đọc']] as const;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#fff' }}>
      {/* Header trắng, gọn — tiêu đề + đọc hết + tab phân đoạn */}
      <FixedHeader sx={{ bgcolor: '#fff', px: 2, pt: 'calc(var(--app-safe-area-top) + 14px)', pb: 1.25, borderBottom: '1px solid #F1F3F5' }}>
        <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Thông báo</Typography>
          {unreadCount > 0 && (
            <Button
              size="small" onClick={() => readAll.mutate()} disabled={readAll.isPending}
              startIcon={<CheckCheck size={16} />} sx={{ color: 'primary.main', fontWeight: 600 }}
            >
              Đọc hết
            </Button>
          )}
        </Stack>
        <Box sx={{ display: 'flex', gap: 0.5, p: 0.5, borderRadius: 2.5, bgcolor: '#F3F4F6' }}>
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <Box
                key={key} component="button" onClick={() => setTab(key)}
                sx={{
                  flex: 1, border: 0, cursor: 'pointer', py: 0.875, borderRadius: 2, fontFamily: 'inherit',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  bgcolor: active ? '#fff' : 'transparent',
                  color: active ? 'text.primary' : 'text.secondary',
                  boxShadow: active ? '0 1px 3px rgba(16,24,40,0.1)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.625,
                  transition: 'background-color .15s, box-shadow .15s',
                }}
              >
                {label}
                {key === 'unread' && unreadCount > 0 && (
                  <Box component="span" sx={{ fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, px: 0.5, borderRadius: '9px', bgcolor: active ? 'primary.main' : 'rgba(0,0,0,0.12)', color: active ? '#fff' : 'text.secondary', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </FixedHeader>

      {feed.isLoading ? (
        <LoadingScreen height={280} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<BellOff size={40} strokeWidth={1.5} />}
          title={tab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
          hint="Cập nhật về đơn hàng, phản ánh và hồ sơ sẽ hiển thị tại đây."
        />
      ) : (
        <Box sx={{ px: 1.5, pt: 0.5, pb: 3 }}>
          {shown.map((n, i) => (
            <Box key={n.id}>
              <NotificationItem n={n} onOpen={openNoti} />
              {i < shown.length - 1 && <Box sx={{ borderBottom: '1px dashed #EAECEF', mx: 0.5 }} />}
            </Box>
          ))}
          {feed.hasNextPage && (
            <Button
              variant="text" onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage}
              startIcon={feed.isFetchingNextPage ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ display: 'flex', mx: 'auto', mt: 1 }}
            >
              {feed.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
