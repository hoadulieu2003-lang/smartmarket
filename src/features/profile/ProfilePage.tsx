import { Avatar, Box, Card, Divider, Stack, Typography } from '@mui/material';
import {
  ChevronRight, ClipboardList, MapPin, MessageSquareWarning, Star, Store, UserCog,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FixedHeader, Screen, StatusChip } from '@/components/ui/bits';
import { useAuth } from '@/stores';
import { APPLICATION_STATUS } from '@/utils';
import type { ApplicationStatus } from '@/types';

const VISIBLE_APPLICATIONS: ApplicationStatus[] = ['pending', 'reviewing', 'need_more_info', 'rejected'];

function MenuRow({
  icon, label, hint, onClick,
}: { icon: ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        width: '100%', border: 0, bgcolor: 'transparent', cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
      }}
    >
      <Box
        sx={{
          width: 36, height: 36, borderRadius: 2, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(22,163,74,0.1)', color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2" fontWeight={600} flex={1}>{label}</Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 130 }}>
          {hint}
        </Typography>
      )}
      <ChevronRight size={18} color="#9AA0A6" />
    </Box>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isMerchant, seller, merchantApplication, selectedMarket, setMode } = useAuth();

  const hasVisibleApplication = !!merchantApplication && VISIBLE_APPLICATIONS.includes(merchantApplication.status);

  function goSeller() {
    setMode('seller');
    navigate('/seller/dashboard');
  }

  return (
    <Box>
      {/* Header xanh — vùng tiêu đề của trang có bottom nav */}
      <FixedHeader
        sx={{
          bgcolor: 'primary.main', color: '#fff', px: 2, pb: 3,
          pt: 'calc(var(--app-safe-area-top) + 20px)',
          borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        }}
      >
        <Stack direction="row" gap={1.5} alignItems="center">
          <Avatar
            src={user?.avatar || undefined}
            sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.25)', fontSize: 24, fontWeight: 700 }}
          >
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="h6" fontWeight={700} noWrap>{user?.fullName ?? 'Người dùng'}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>{user?.phone ?? 'Chưa cập nhật số điện thoại'}</Typography>
          </Box>
        </Stack>
      </FixedHeader>

      <Screen>
        {/* Khối tiểu thương: ưu tiên chuyển chế độ → hồ sơ hiện tại (kể cả bị từ chối) → đăng ký */}
        {isMerchant && seller ? (
          <Card
            onClick={goSeller}
            sx={{ cursor: 'pointer', p: 2, mb: 2, bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}
          >
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Store size={22} />
            </Box>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={700}>Chuyển sang chế độ Tiểu thương</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }} noWrap display="block">
                Quản lý sạp {seller.stallName || seller.stallCode}
              </Typography>
            </Box>
            <ChevronRight size={20} />
          </Card>
        ) : hasVisibleApplication && merchantApplication ? (
          <Card
            onClick={() => navigate('/merchant-apply/status')}
            sx={{ cursor: 'pointer', p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
          >
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(22,163,74,0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Store size={22} />
            </Box>
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={700}>Hồ sơ đăng ký tiểu thương</Typography>
              <Typography variant="caption" color="text.secondary">
                {merchantApplication.status === 'rejected' ? 'Nhấn để chỉnh sửa và gửi lại' : 'Nhấn để xem chi tiết'}
              </Typography>
            </Box>
            <StatusChip
              label={APPLICATION_STATUS[merchantApplication.status].label}
              tone={APPLICATION_STATUS[merchantApplication.status].tone}
            />
          </Card>
        ) : !isMerchant && !merchantApplication ? (
          <Card
            onClick={() => navigate('/merchant-apply')}
            sx={{ cursor: 'pointer', p: 2, mb: 2, border: '1px dashed', borderColor: 'primary.main', bgcolor: 'rgba(22,163,74,0.04)', display: 'flex', alignItems: 'center', gap: 1.5 }}
          >
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(22,163,74,0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Store size={22} />
            </Box>
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={700} color="primary.main">Đăng ký làm tiểu thương</Typography>
              <Typography variant="caption" color="text.secondary">Mở sạp và bắt đầu bán hàng trên chợ</Typography>
            </Box>
            <ChevronRight size={20} color="#16A34A" />
          </Card>
        ) : null}

        {/* Menu */}
        <Card sx={{ overflow: 'hidden' }}>
          <Stack divider={<Divider />}>
            <MenuRow icon={<ClipboardList size={18} />} label="Đơn hàng của tôi" onClick={() => navigate('/orders')} />
            <MenuRow icon={<Star size={18} />} label="Đánh giá của tôi" onClick={() => navigate('/profile/reviews')} />
            <MenuRow icon={<MessageSquareWarning size={18} />} label="Phản ánh của tôi" onClick={() => navigate('/feedback')} />
            <MenuRow icon={<UserCog size={18} />} label="Chỉnh sửa thông tin" onClick={() => navigate('/profile/settings')} />
            <MenuRow icon={<MapPin size={18} />} label="Đổi chợ" hint={selectedMarket?.name} onClick={() => navigate('/markets')} />
          </Stack>
        </Card>

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
          Đăng nhập bằng tài khoản Zalo của bạn
        </Typography>
      </Screen>
    </Box>
  );
}
