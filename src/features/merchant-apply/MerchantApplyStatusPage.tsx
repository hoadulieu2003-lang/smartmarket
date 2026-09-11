import { Alert, Box, Button, Card, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, errMsg } from '@/services/api';
import { EmptyState, Field, LoadingScreen, Screen, StatusChip, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { APPLICATION_STATUS, formatDate, formatDateTime } from '@/utils';
import type { Application, ApplicationStatus, Img } from '@/types';
import { ApplicationForm } from './ApplicationForm';

type MyApplication = { current: Application | null; history: Application[] };
const OPEN_STATUSES: ApplicationStatus[] = ['pending', 'reviewing', 'need_more_info'];

export function MerchantApplyStatusPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const q = useQuery({
    queryKey: ['my-merchant-application'],
    queryFn: () => apiGet<MyApplication>('/my/merchant-application'),
  });

  const cancel = useMutation({
    mutationFn: () => apiPost('/my/merchant-application/cancel'),
    onSuccess: () => {
      toast.success('Đã huỷ hồ sơ');
      qc.invalidateQueries({ queryKey: ['my-merchant-application'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const current = q.data?.current ?? null;
  const history = q.data?.history ?? [];

  if (q.isLoading) {
    return (
      <Box>
        <TopBar title="Trạng thái hồ sơ" onBack />
        <LoadingScreen height={320} />
      </Box>
    );
  }

  if (!current) {
    return (
      <Box>
        <TopBar title="Trạng thái hồ sơ" onBack />
        <Screen>
          <EmptyState
            title="Bạn chưa có hồ sơ"
            hint="Đăng ký để trở thành tiểu thương và bán hàng trên chợ."
            action={<Button variant="contained" sx={{ mt: 1 }} onClick={() => navigate('/merchant-apply')}>Đăng ký ngay</Button>}
          />
        </Screen>
      </Box>
    );
  }

  if (editing) {
    const rejected = current.status === 'rejected';
    return (
      <Box>
        <TopBar title={rejected ? 'Chỉnh sửa hồ sơ' : 'Bổ sung hồ sơ'} onBack={() => setEditing(false)} />
        <Screen>
          {rejected && current.adminNote && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" mb={0.25}>Lý do từ chối</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{current.adminNote}</Typography>
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" mb={2}>
            {rejected
              ? 'Chỉnh sửa hồ sơ theo lý do từ chối của ban quản lý rồi gửi duyệt lại.'
              : 'Cập nhật thông tin theo yêu cầu của ban quản lý rồi gửi lại hồ sơ.'}
          </Typography>
          <ApplicationForm
            mode="edit"
            marketName={current.markets?.name ?? ''}
            editLabel={rejected ? 'Chỉnh sửa & gửi duyệt lại' : undefined}
            initial={{
              categoryId: current.categoryId,
              fullName: current.fullName,
              phone: current.phone,
              idNumber: current.idNumber,
              businessDescription: current.businessDescription ?? '',
              desiredStallNote: current.desiredStallNote ?? '',
              documents: current.documents,
            }}
            onDone={() => {
              setEditing(false);
              qc.invalidateQueries({ queryKey: ['my-merchant-application'] });
              qc.invalidateQueries({ queryKey: ['me'] });
            }}
          />
        </Screen>
      </Box>
    );
  }

  const status = APPLICATION_STATUS[current.status];
  const isOpen = OPEN_STATUSES.includes(current.status);
  const showAdminNote = !!current.adminNote;

  return (
    <Box>
      <TopBar title="Trạng thái hồ sơ" onBack />
      <Screen>
        <Stack gap={1.5}>
          <Card sx={{ p: 1.75 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={1.25}>
              <Typography variant="subtitle1" flex={1}>Hồ sơ đăng ký</Typography>
              <StatusChip label={status.label} tone={status.tone} />
            </Stack>
            <Stack gap={1.25}>
              <Field label="Chợ đăng ký">{current.markets?.name ?? '—'}</Field>
              {current.categories?.name && <Field label="Ngành hàng">{current.categories.name}</Field>}
              <Field label="Họ và tên">{current.fullName}</Field>
              <Field label="Số điện thoại">{current.phone}</Field>
              <Field label="Số CCCD/CMND">{current.idNumber}</Field>
              {current.businessDescription && <Field label="Mặt hàng kinh doanh">{current.businessDescription}</Field>}
              {current.desiredStallNote && <Field label="Nguyện vọng về sạp">{current.desiredStallNote}</Field>}
              <Field label="Ngày gửi">{formatDateTime(current.createdAt)}</Field>
            </Stack>
            {current.documents.length > 0 && (
              <Box mt={1.5}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>Ảnh giấy tờ</Typography>
                <ImageGallery images={current.documents} />
              </Box>
            )}
          </Card>

          {showAdminNote && (
            <Card sx={{ p: 1.75, border: '1px solid', borderColor: current.status === 'rejected' ? '#FECACA' : '#FDE68A', bgcolor: current.status === 'rejected' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.06)' }}>
              <Typography variant="subtitle2" mb={0.5} color={current.status === 'rejected' ? 'error.main' : 'warning.main'}>
                {current.status === 'need_more_info' ? 'Yêu cầu bổ sung' : current.status === 'rejected' ? 'Lý do từ chối' : 'Ghi chú từ ban quản lý'}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{current.adminNote}</Typography>
            </Card>
          )}

          {current.status === 'approved' && (
            <Card sx={{ p: 2, border: '1px solid #BBF7D0', bgcolor: 'rgba(22,163,74,0.05)', textAlign: 'center' }}>
              <PartyPopper size={32} color="#16A34A" style={{ margin: '0 auto 8px' }} />
              <Typography variant="subtitle1" color="primary.main" gutterBottom>Chúc mừng!</Typography>
              <Typography variant="body2" color="text.secondary">
                Hồ sơ của bạn đã được duyệt. Hãy mở lại ứng dụng để chuyển sang chế độ Tiểu thương và bắt đầu bán hàng.
              </Typography>
              <Button variant="contained" sx={{ mt: 1.5 }} onClick={() => navigate('/')}>Về trang chủ</Button>
            </Card>
          )}

          {current.status === 'need_more_info' && (
            <Button variant="contained" size="large" fullWidth onClick={() => setEditing(true)}>
              Bổ sung & gửi lại
            </Button>
          )}

          {current.status === 'rejected' && (
            <Button variant="contained" size="large" fullWidth onClick={() => setEditing(true)}>
              Chỉnh sửa hồ sơ & gửi duyệt lại
            </Button>
          )}

          {isOpen && (
            <Button
              variant="outlined" color="error" size="large" fullWidth
              disabled={cancel.isPending}
              onClick={() => { if (window.confirm('Bạn chắc chắn muốn huỷ hồ sơ này?')) cancel.mutate(); }}
            >
              {cancel.isPending ? 'Đang huỷ...' : 'Huỷ hồ sơ'}
            </Button>
          )}

          {history.length > 0 && (
            <Box mt={1}>
              <Typography variant="subtitle2" mb={1}>Lịch sử hồ sơ</Typography>
              <Stack gap={1}>
                {history.map((h) => {
                  const hs = APPLICATION_STATUS[h.status];
                  return (
                    <Card key={h.id} sx={{ p: 1.5 }}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body2" fontWeight={600} noWrap>{h.markets?.name ?? 'Chợ'}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(h.createdAt)}</Typography>
                        </Box>
                        <StatusChip label={hs.label} tone={hs.tone} />
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Stack>
      </Screen>
    </Box>
  );
}

function ImageGallery({ images }: { images: Img[] }) {
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {images.map((img) => (
        <Box
          key={img.url} component="img" src={img.url} alt="Ảnh giấy tờ"
          sx={{ width: 88, height: 88, borderRadius: 2, objectFit: 'cover', border: '1px solid #EEF0F2' }}
        />
      ))}
    </Stack>
  );
}
