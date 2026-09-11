import { Badge, Box } from '@mui/material';
import {
  Bell, Home, LayoutDashboard, Package, ScanLine, Search, ShoppingBag, ShoppingCart, Tag, User,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import { useAuth, useCart } from '@/stores';

interface NavItem { to: string; label: string; icon: ReactNode; match: (p: string) => boolean; badge?: number }

/** Nút giỏ hàng nổi — chỉ hiện khi giỏ có hàng. */
function CartFab() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const qty = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  if (qty === 0 || pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return null;
  return (
    <Box
      component="button"
      onClick={() => navigate('/cart')}
      aria-label={`Giỏ hàng, ${qty} sản phẩm`}
      sx={{
        position: 'fixed', bottom: 'calc(80px + var(--app-safe-area-bottom))', right: 16, zIndex: 25,
        border: 0, p: 0, cursor: 'pointer', width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(22,163,74,0.36)',
        transition: 'transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s',
        '&:hover': { boxShadow: '0 10px 24px rgba(22,163,74,0.46)' },
        '&:active': { transform: 'scale(0.9)' },
        ...(typeof window !== 'undefined' && window.innerWidth > 480 ? { right: 'calc(50% - 240px + 16px)' } : {}),
      }}
    >
      <ShoppingCart size={24} color="#fff" strokeWidth={2.2} />
      {/* Badge số lượng — canh góc phải trên, viền trắng để nổi */}
      <Box
        component="span"
        aria-hidden
        sx={{
          position: 'absolute', top: -2, right: -2, boxSizing: 'border-box',
          minWidth: 20, height: 20, px: '5px', borderRadius: '10px',
          bgcolor: '#EF4444', color: '#fff', border: '2px solid #fff',
          fontSize: 11, fontWeight: 700, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {qty > 99 ? '99+' : qty}
      </Box>
    </Box>
  );
}

function NavCell({ item }: { item: NavItem }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = item.match(pathname);
  return (
    <Box
      component="button"
      onClick={() => navigate(item.to)}
      sx={{
        flex: 1, border: 0, bgcolor: 'transparent', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, py: 0.75,
        color: active ? 'primary.main' : 'text.secondary',
      }}
    >
      <Badge color="error" badgeContent={item.badge} max={9} overlap="circular">{item.icon}</Badge>
      <Box component="span" sx={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{item.label}</Box>
    </Box>
  );
}

/** Bottom nav. Khi có `center` → bar có notch cong + nút tròn nổi ở giữa (buyer). */
function BottomNav({ items, center }: { items: NavItem[]; center?: NavItem }) {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 20,
        // KHÔNG đặt nền ở đây — để vùng notch trong suốt, lộ background phía sau
      }}
    >
      {center ? (
        <Box sx={{ position: 'relative', height: 60 }}>
          {/* Quầng nền mờ quanh nút: dùng chính màu nền trang (#f3f4f6), mép fade dần.
              Nằm DƯỚI bar trắng nên chỉ lộ ở vùng notch + hai bên nút → che nội dung lọt qua,
              KHÔNG tạo khối cứng, hoà với background. */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute', top: -46, left: '50%', transform: 'translateX(-50%)',
              width: 86, height: 86, borderRadius: '50%', pointerEvents: 'none',
              background: 'radial-gradient(circle, #f3f4f6 56%, rgba(243,244,246,0) 74%)',
            }}
          />
          {/* Bar trắng CÓ notch — nền trong suốt để notch hoà với background sau lưng */}
          <Box
            component="svg"
            viewBox="0 0 480 60"
            preserveAspectRatio="none"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <path d="M0 0 L192 0 C208 0 213 28 240 28 C267 28 272 0 288 0 L480 0 L480 60 L0 60 Z" fill="#fff" />
            <path d="M0 0.75 L192 0.75 C208 0.75 213 28.75 240 28.75 C267 28.75 272 0.75 288 0.75 L480 0.75" fill="none" stroke="#EDEFF2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </Box>
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <NavCell item={items[0]!} />
            <NavCell item={items[1]!} />
            <Box sx={{ width: 74, flexShrink: 0 }} />
            <NavCell item={items[2]!} />
            <NavCell item={items[3]!} />
          </Box>
          {/* Nút giữa nổi CÁCH notch một khoảng (raised) */}
          <Box
            component="button"
            onClick={() => navigate(center.to)}
            aria-label={center.label}
            sx={{
              position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
              width: 50, height: 50, borderRadius: '50%', border: '3px solid #fff',
              bgcolor: 'primary.main', color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 8px 18px rgba(22,163,74,0.45)',
              transition: 'transform .16s cubic-bezier(.34,1.56,.64,1), box-shadow .16s',
              '&:active': { transform: 'translateX(-50%) scale(0.9)' },
            }}
          >
            {center.icon}
          </Box>
          <Box sx={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
            {center.label}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 60, bgcolor: '#fff', borderTop: '1px solid #EEF0F2' }}>
          {items.map((item) => <NavCell key={item.to} item={item} />)}
        </Box>
      )}
      {/* Dải trắng cho safe-area + 8px: bar chạm mép dưới nhưng icon cách thanh điều hướng OS.
          Không có notch → luôn đặc, chỉ nằm DƯỚI bar nên không ảnh hưởng vùng notch. */}
      <Box sx={{ height: 'calc(var(--app-safe-area-bottom) + 8px)', bgcolor: '#fff' }} />
    </Box>
  );
}

const startsWith = (base: string) => (p: string) => (base === '/' ? p === '/' : p === base || p.startsWith(`${base}/`));

export function BuyerLayout() {
  const token = useAuth((s) => s.accessToken);
  const unread = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => apiGet<{ unreadCount: number }>('/notifications/unread-count'),
    enabled: !!token,
    refetchInterval: 60_000,
  });
  const items: NavItem[] = [
    { to: '/', label: 'Trang chủ', icon: <Home size={22} />, match: (p) => p === '/' },
    { to: '/search', label: 'Tìm kiếm', icon: <Search size={22} />, match: startsWith('/search') },
    { to: '/notifications', label: 'Thông báo', icon: <Bell size={22} />, match: startsWith('/notifications'), badge: unread.data?.unreadCount },
    { to: '/profile', label: 'Cá nhân', icon: <User size={22} />, match: startsWith('/profile') },
  ];
  const center: NavItem = { to: '/qr', label: 'Quét mã', icon: <ScanLine size={22} />, match: startsWith('/qr') };
  return (
    <Box sx={{ minHeight: '100dvh', pb: 'calc(76px + var(--app-safe-area-bottom))' }}>
      <Outlet />
      <CartFab />
      <BottomNav items={items} center={center} />
    </Box>
  );
}

export function SellerLayout() {
  const items: NavItem[] = [
    { to: '/seller/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={22} />, match: startsWith('/seller/dashboard') },
    { to: '/seller/products', label: 'Sản phẩm', icon: <Package size={22} />, match: startsWith('/seller/products') },
    { to: '/seller/orders', label: 'Đơn hàng', icon: <ShoppingBag size={22} />, match: startsWith('/seller/orders') },
    { to: '/seller/promotions', label: 'Khuyến mãi', icon: <Tag size={22} />, match: startsWith('/seller/promotions') },
    { to: '/seller/profile', label: 'Cá nhân', icon: <User size={22} />, match: startsWith('/seller/profile') },
  ];
  return (
    <Box sx={{ minHeight: '100dvh', pb: 'calc(72px + var(--app-safe-area-bottom))' }}>
      <Outlet />
      <BottomNav items={items} />
    </Box>
  );
}
