import {
  Box, Button, Chip, CircularProgress, Drawer, IconButton, Stack, Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { ArrowLeft, Inbox, Star, X } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney, toneColor } from '@/utils';

/** Giá tiền. */
export function Money({ value, className }: { value?: number | null; className?: string }) {
  return <span className={className}>{formatMoney(value)}</span>;
}

/** Giá bán: finalPrice nổi bật + gạch giá gốc nếu đang giảm. */
export function Price({ price, finalPrice, isOnSale, size = 'md' }: { price: number; finalPrice?: number; isOnSale?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const fs = size === 'lg' ? 20 : size === 'sm' ? 14 : 16;
  return (
    <Stack direction="row" alignItems="baseline" gap={0.75} flexWrap="wrap">
      <Typography component="span" sx={{ fontSize: fs, fontWeight: 700, color: 'primary.main' }}>
        {formatMoney(finalPrice ?? price)}
      </Typography>
      {isOnSale && (
        <Typography component="span" sx={{ fontSize: fs - 3, color: 'text.secondary', textDecoration: 'line-through' }}>
          {formatMoney(price)}
        </Typography>
      )}
    </Stack>
  );
}

export function StatusChip({ label, tone }: { label: string; tone: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }) {
  return <Chip size="small" label={label} color={toneColor[tone]} variant={tone === 'default' ? 'outlined' : 'filled'} sx={{ height: 24 }} />;
}

export function Stars({ value, count, size = 14 }: { value?: number; count?: number; size?: number }) {
  if (!value) return <Typography variant="caption" color="text.secondary">Chưa có đánh giá</Typography>;
  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Star size={size} color="#F59E0B" fill="#F59E0B" />
      <Typography component="span" sx={{ fontSize: size, fontWeight: 700 }}>{value.toFixed(1)}</Typography>
      {count !== undefined && <Typography variant="caption" color="text.secondary">({count})</Typography>}
    </Stack>
  );
}

/** Vùng nội dung trang (padding + chừa chỗ cho bottom nav). */
export function Screen({ children, pb = 12, px = 2 }: { children: ReactNode; pb?: number; px?: number }) {
  return <Box sx={{ px, pt: 2, pb }}>{children}</Box>;
}

/**
 * Header fixed cho các màn tab chính.
 * Spacer được đo theo kích thước thật để safe-area và nội dung động không đè lên phần thân trang.
 */
export function FixedHeader({
  children, contentGap = 0, sx,
}: { children: ReactNode; contentGap?: number; sx?: SxProps<Theme> }) {
  const headerRef = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const measure = () => {
      const next = header.getBoundingClientRect().height;
      setHeight((current) => (Math.abs(current - next) < 0.5 ? current : next));
    };

    measure();
    window.addEventListener('resize', measure);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const customSx = sx ? (Array.isArray(sx) ? sx : [sx]) : [];

  return (
    <>
      <Box aria-hidden sx={{ height, flexShrink: 0, mb: contentGap }} />
      <Box
        ref={headerRef}
        component="header"
        sx={[
          {
            position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, zIndex: 30,
          },
          ...customSx,
        ]}
      >
        {children}
      </Box>
    </>
  );
}

/** Header mobile: nút back + tiêu đề + action phải. */
export function TopBar({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: ReactNode; onBack?: boolean | (() => void) }) {
  const navigate = useNavigate();
  const back = onBack === true ? () => navigate(-1) : typeof onBack === 'function' ? onBack : undefined;
  const hasZaloNativeMenu = typeof navigator !== 'undefined' && /zalo/i.test(navigator.userAgent);
  return (
    <>
      {/* Spacer giữ nội dung nằm dưới header fixed, kể cả phần tai thỏ/status bar. */}
      <Box aria-hidden sx={{ height: 'var(--app-topbar-height)' }} />
      <Box
        component="header"
        sx={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, height: 'var(--app-topbar-height)', zIndex: 30,
          bgcolor: '#fff', borderBottom: '1px solid #EEF0F2', px: 1,
          pt: 'var(--app-safe-area-top)',
          display: 'flex', alignItems: 'center', gap: 1,
        }}
      >
        {back ? (
          <IconButton size="small" onClick={back} aria-label="Quay lại"><ArrowLeft size={20} /></IconButton>
        ) : <Box width={8} />}
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle1" noWrap>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary" noWrap display="block">{subtitle}</Typography>}
        </Box>
        {right}
        {/* Cụm menu native của Zalo phủ bên phải hàng header. */}
        {hasZaloNativeMenu && <Box aria-hidden sx={{ width: 88, flexShrink: 0 }} />}
      </Box>
    </>
  );
}

export function LoadingScreen({ height = 200 }: { height?: number }) {
  return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}><CircularProgress /></Box>;
}

export function EmptyState({ title = 'Chưa có dữ liệu', hint, icon, action }: { title?: string; hint?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <Stack alignItems="center" gap={1.25} sx={{ py: 8, px: 3, textAlign: 'center', color: 'text.secondary' }}>
      {icon ?? <Inbox size={40} strokeWidth={1.5} />}
      <Typography variant="subtitle2" color="text.primary">{title}</Typography>
      {hint && <Typography variant="body2">{hint}</Typography>}
      {action}
    </Stack>
  );
}

export function ErrorState({ onRetry, message = 'Không tải được dữ liệu' }: { onRetry?: () => void; message?: string }) {
  return (
    <Stack alignItems="center" gap={1.5} sx={{ py: 8, px: 3, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">{message}</Typography>
      {onRetry && <Button variant="outlined" size="small" onClick={onRetry}>Thử lại</Button>}
    </Stack>
  );
}

/** Bottom sheet (chọn chợ, đơn vị, loại phản ánh, role...). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  return (
    <Drawer
      anchor="bottom" open={open} onClose={onClose}
      PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85vh', mx: 'auto', maxWidth: 480 } }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
        <Box sx={{ width: 40, height: 4, bgcolor: '#E5E7EB', borderRadius: 2, mx: 'auto', mb: 1.5 }} />
        {title && (
          <Stack direction="row" alignItems="center" mb={1.5}>
            <Typography variant="subtitle1" flex={1}>{title}</Typography>
            <IconButton size="small" onClick={onClose} aria-label="Đóng"><X size={18} /></IconButton>
          </Stack>
        )}
        {children}
      </Box>
    </Drawer>
  );
}

/** Cặp nhãn – giá trị. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" component="div" fontWeight={500}>{children ?? '—'}</Typography>
    </Box>
  );
}
