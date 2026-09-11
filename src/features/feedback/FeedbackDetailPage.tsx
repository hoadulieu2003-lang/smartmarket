import { Box, Card, Divider, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { EmptyState, Field, LoadingScreen, Screen, StatusChip, TopBar } from '@/components/ui/bits';
import { COMPLAINT_STATUS, COMPLAINT_TYPE, formatDateTime } from '@/utils';
import type { Complaint, Img } from '@/types';

export function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();

  const q = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => apiGet<Complaint>(`/complaints/${id}`),
    enabled: !!id,
  });

  const c = q.data;
  const stallText = c?.stalls ? c.stalls.name || `Sạp ${c.stalls.code}` : null;
  const status = c ? COMPLAINT_STATUS[c.status] : null;

  return (
    <Box>
      <TopBar title="Chi tiết phản ánh" onBack />
      <Screen>
        {q.isLoading ? (
          <LoadingScreen />
        ) : !c ? (
          <EmptyState title="Không tìm thấy phản ánh" hint="Phản ánh có thể đã bị xoá hoặc không tồn tại." />
        ) : (
          <Stack gap={1.5}>
            <Card sx={{ p: 1.75 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={1.25}>
                <Typography variant="subtitle1" flex={1}>{COMPLAINT_TYPE[c.type]}</Typography>
                {status && <StatusChip label={status.label} tone={status.tone} />}
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{c.content}</Typography>
              {c.images.length > 0 && (
                <Box mt={1.5}><ImageGallery images={c.images} /></Box>
              )}
            </Card>

            <Card sx={{ p: 1.75 }}>
              <Stack gap={1.25}>
                <Field label="Chợ">{c.markets?.name ?? '—'}</Field>
                {stallText && <Field label="Sạp">{stallText}</Field>}
                {c.products?.name && <Field label="Sản phẩm">{c.products.name}</Field>}
                <Field label="Thời gian gửi">{formatDateTime(c.createdAt)}</Field>
              </Stack>
            </Card>

            {c.status === 'resolved' && (
              <Card sx={{ p: 1.75, border: '1px solid #BBF7D0', bgcolor: 'rgba(22,163,74,0.04)' }}>
                <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
                  <CheckCircle2 size={18} color="#16A34A" />
                  <Typography variant="subtitle2" color="primary.main">Kết quả xử lý</Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {c.resolutionNote || 'Phản ánh đã được xử lý.'}
                </Typography>
                {c.resolutionImages.length > 0 && (
                  <Box mt={1.5}><ImageGallery images={c.resolutionImages} /></Box>
                )}
                {c.resolvedAt && (
                  <>
                    <Divider sx={{ my: 1.25 }} />
                    <Typography variant="caption" color="text.secondary">
                      Xử lý lúc {formatDateTime(c.resolvedAt)}
                    </Typography>
                  </>
                )}
              </Card>
            )}
          </Stack>
        )}
      </Screen>
    </Box>
  );
}

function ImageGallery({ images }: { images: Img[] }) {
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {images.map((img) => (
        <Box
          key={img.url} component="img" src={img.url} alt="Ảnh đính kèm"
          sx={{ width: 88, height: 88, borderRadius: 2, objectFit: 'cover', border: '1px solid #EEF0F2' }}
        />
      ))}
    </Stack>
  );
}
