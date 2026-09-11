import { Box, Button, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/services/api';
import { EmptyState, LoadingScreen, Screen, TopBar } from '@/components/ui/bits';
import { useAuth } from '@/stores';
import type { Application, ApplicationStatus } from '@/types';
import { ApplicationForm } from './ApplicationForm';

type MyApplication = { current: Application | null; history: Application[] };
const REDIRECT_STATUSES: ApplicationStatus[] = ['pending', 'reviewing', 'need_more_info', 'approved', 'rejected'];

export function MerchantApplyPage() {
  const navigate = useNavigate();
  const { user, selectedMarket } = useAuth();

  const q = useQuery({
    queryKey: ['my-merchant-application'],
    queryFn: () => apiGet<MyApplication>('/my/merchant-application'),
  });

  const currentStatus = q.data?.current?.status;
  const redirecting = !!currentStatus && REDIRECT_STATUSES.includes(currentStatus);

  useEffect(() => {
    if (redirecting) navigate('/merchant-apply/status', { replace: true });
  }, [redirecting, navigate]);

  return (
    <Box>
      <TopBar title="Đăng ký tiểu thương" onBack />
      {q.isLoading || redirecting ? (
        <LoadingScreen height={320} />
      ) : !selectedMarket ? (
        <Screen>
          <EmptyState
            title="Bạn chưa chọn chợ"
            hint="Hãy chọn khu chợ bạn muốn đăng ký kinh doanh trước."
            action={<Button variant="contained" sx={{ mt: 1 }} onClick={() => navigate('/markets')}>Chọn chợ</Button>}
          />
        </Screen>
      ) : (
        <Screen>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Điền thông tin để đăng ký trở thành tiểu thương. Ban quản lý chợ sẽ xem xét và phản hồi hồ sơ của bạn.
          </Typography>
          <ApplicationForm
            mode="create"
            marketId={selectedMarket.id}
            marketName={selectedMarket.name}
            initial={{ fullName: user?.fullName ?? '', phone: user?.phone ?? '' }}
            onDone={() => navigate('/merchant-apply/status')}
          />
        </Screen>
      )}
    </Box>
  );
}
