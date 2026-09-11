import { Avatar, Box, Button, Card, Stack, Typography } from '@mui/material';
import { ArrowLeftRight, ChevronRight, Package, ShoppingBag, Store } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FixedHeader, Screen } from '@/components/ui/bits';
import { useAuth } from '@/stores';

export function SellerProfilePage() {
  const navigate = useNavigate();
  const { user, seller, setMode } = useAuth();

  const menu: { icon: ReactNode; label: string; to: string }[] = [
    { icon: <Store size={20} />, label: 'Sạp của tôi', to: '/seller/stall' },
    { icon: <Package size={20} />, label: 'Sản phẩm', to: '/seller/products' },
    { icon: <ShoppingBag size={20} />, label: 'Đơn hàng', to: '/seller/orders' },
  ];

  function backToBuyer() {
    setMode('buyer');
    navigate('/');
  }

  return (
    <Box>
      {/* Header xanh: tiểu thương + sạp */}
      <FixedHeader sx={{ bgcolor: 'primary.main', color: '#fff', pt: 'calc(var(--app-safe-area-top) + 16px)', pb: 3, px: 2, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Avatar src={user?.avatar || undefined} sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 700 }}>
            {(user?.fullName || 'T')[0]}
          </Avatar>
          <Box minWidth={0}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }} noWrap>{user?.fullName || 'Tiểu thương'}</Typography>
            <Stack direction="row" alignItems="center" gap={0.75} sx={{ opacity: 0.95 }}>
              <Box component="span" sx={{ bgcolor: 'rgba(255,255,255,0.22)', borderRadius: 1, px: 0.75, py: 0.125, fontSize: 12, fontWeight: 600 }}>
                Tiểu thương
              </Box>
              <Typography variant="caption" noWrap>Sạp {seller?.stallCode ?? '—'}</Typography>
            </Stack>
            {seller?.marketName && <Typography variant="caption" sx={{ opacity: 0.85 }} noWrap display="block">{seller.marketName}</Typography>}
          </Box>
        </Stack>
      </FixedHeader>

      <Screen>
        {/* Menu quản lý */}
        <Card sx={{ overflow: 'hidden' }}>
          {menu.map((m, i) => (
            <Box key={m.to}>
              <Box
                component="button" onClick={() => navigate(m.to)}
                sx={{ width: '100%', border: 0, bgcolor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5, px: 1.75, py: 1.5, textAlign: 'left' }}
              >
                <Box sx={{ width: 38, height: 38, borderRadius: 2.5, bgcolor: 'rgba(22,163,74,0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {m.icon}
                </Box>
                <Typography variant="body2" fontWeight={600} flex={1}>{m.label}</Typography>
                <ChevronRight size={18} color="#9CA3AF" />
              </Box>
              {i < menu.length - 1 && <Box sx={{ height: '1px', bgcolor: '#F1F3F5', ml: 7 }} />}
            </Box>
          ))}
        </Card>

        {/* Chuyển chế độ */}
        <Button fullWidth size="large" variant="contained" startIcon={<ArrowLeftRight size={20} />} sx={{ mt: 2.5 }} onClick={backToBuyer}>
          Quay lại chế độ Mua hàng
        </Button>
      </Screen>
    </Box>
  );
}
