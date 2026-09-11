import {
  Box, Button, CircularProgress, Divider, Stack, TextField, Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiDelete, apiGet, apiPut, errMsg } from '@/services/api';
import { EmptyState, LoadingScreen, Screen, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { formatMoney, formatMoneyInput } from '@/utils';
import type { DiscountType, Product } from '@/types';

const toDateInput = (v: string | null) => (v ? dayjs(v).format('YYYY-MM-DD') : '');

export function SellerPromotionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const seeded = useRef(false);

  const [type, setType] = useState<DiscountType>('percent');
  const [value, setValue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState('');

  const detail = useQuery({
    queryKey: ['seller-product', id],
    queryFn: () => apiGet<Product>(`/seller/products/${id}`),
    enabled: !!id,
  });
  const product = detail.data;
  const hasPromotion = !!product?.discountType;

  useEffect(() => {
    if (!product || seeded.current) return;
    seeded.current = true;
    if (product.discountType) {
      setType(product.discountType);
      setValue(product.discountValue != null ? String(product.discountValue) : '');
      setStartAt(toDateInput(product.discountStartAt));
      setEndAt(toDateInput(product.discountEndAt));
    }
  }, [product]);

  const apply = useMutation({
    mutationFn: () =>
      apiPut(`/seller/products/${id}/promotion`, {
        type,
        value: Number(value),
        startAt: startAt || undefined,
        endAt: endAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      qc.invalidateQueries({ queryKey: ['seller-product', id] });
      qc.invalidateQueries({ queryKey: ['seller-dashboard'] });
      toast.success('Đã áp dụng khuyến mãi');
      navigate(-1);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const removePromo = useMutation({
    mutationFn: () => apiDelete(`/seller/products/${id}/promotion`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      qc.invalidateQueries({ queryKey: ['seller-product', id] });
      qc.invalidateQueries({ queryKey: ['seller-dashboard'] });
      toast.success('Đã gỡ khuyến mãi');
      navigate(-1);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (detail.isLoading) {
    return (
      <Box>
        <TopBar title="Khuyến mãi" onBack />
        <LoadingScreen height={300} />
      </Box>
    );
  }
  if (!product) {
    return (
      <Box>
        <TopBar title="Khuyến mãi" onBack />
        <Screen><EmptyState title="Không tìm thấy sản phẩm" hint="Sản phẩm có thể đã bị xóa." /></Screen>
      </Box>
    );
  }

  const priceN = product.price;
  const valN = Number(value) || 0;
  const hasValue = value.trim() !== '';
  const rawPreview = type === 'percent' ? Math.round(priceN * (1 - valN / 100)) : valN;
  const preview = !hasValue ? priceN : Math.max(0, Math.min(priceN, rawPreview));
  const savings = priceN - preview;
  const percentOff = type === 'percent' ? valN : priceN > 0 ? Math.round((savings / priceN) * 100) : 0;

  function validate(): string {
    if (type === 'percent') {
      if (!Number.isInteger(valN) || valN < 1 || valN > 100) return 'Phần trăm giảm phải là số nguyên từ 1 đến 100';
    } else {
      if (!value.trim() || !Number.isInteger(valN) || valN < 0 || valN > priceN) return `Giá sau giảm phải từ 0 đến ${formatMoney(priceN)}`;
    }
    if (startAt && endAt && dayjs(startAt).isAfter(dayjs(endAt))) return 'Ngày bắt đầu phải trước ngày kết thúc';
    return '';
  }

  function submit() {
    const err = validate();
    setError(err);
    if (err) return;
    apply.mutate();
  }

  const busy = apply.isPending || removePromo.isPending;

  return (
    <Box>
      <TopBar title="Khuyến mãi" onBack />
      <Screen pb={hasPromotion ? 20 : 14}>
        <Stack gap={2.5}>
          {/* Sản phẩm + giá gốc */}
          <Stack direction="row" gap={1.5} alignItems="center">
            <Box
              component="img"
              src={product.images?.[0]?.url}
              alt={product.name}
              sx={{ width: 56, height: 56, borderRadius: 2.5, objectFit: 'cover', bgcolor: '#F3F4F6', flexShrink: 0 }}
            />
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600} noWrap>{product.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Giá gốc: <b>{formatMoney(priceN)}</b> /{product.unit}
              </Typography>
            </Box>
          </Stack>

          {/* Kiểu giảm */}
          <Box>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75 }}>Kiểu giảm giá</Typography>
            <Stack direction="row" gap={1} sx={{ p: 0.5, bgcolor: '#F3F4F6', borderRadius: '12px' }}>
              <TypeToggle label="Giảm theo %" active={type === 'percent'} onClick={() => { setType('percent'); setValue(''); setError(''); }} />
              <TypeToggle label="Giá cố định" active={type === 'fixed_price'} onClick={() => { setType('fixed_price'); setValue(''); setError(''); }} />
            </Stack>
          </Box>

          {/* Giá trị giảm */}
          <Box>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75 }}>
              {type === 'percent' ? 'Phần trăm giảm' : 'Giá sau khi giảm'}
            </Typography>
            <TextField
              fullWidth hiddenLabel value={type === 'fixed_price' ? formatMoneyInput(value) : value} error={!!error}
              placeholder={type === 'percent' ? 'VD: 10' : '0'}
              inputProps={{ inputMode: 'numeric' }}
              onChange={(e) => { setValue(e.target.value.replace(/[^\d]/g, '')); setError(''); }}
              InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary">{type === 'percent' ? '%' : 'đ'}</Typography> }}
              helperText={type === 'percent' ? 'Nhập số nguyên từ 1 đến 100' : `Từ 0 đến ${formatMoney(priceN)}`}
            />
            {error && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{error}</Typography>}
          </Box>

          {/* Xem trước */}
          <Box sx={{ bgcolor: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '14px', p: 1.75 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>Xem trước giá bán</Typography>
            <Stack direction="row" alignItems="baseline" gap={1} flexWrap="wrap">
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'primary.main' }}>{formatMoney(preview)}</Typography>
              {savings > 0 && (
                <Typography sx={{ fontSize: 15, color: 'text.secondary', textDecoration: 'line-through' }}>{formatMoney(priceN)}</Typography>
              )}
            </Stack>
            {savings > 0 && (
              <Typography variant="caption" color="error" fontWeight={600}>
                Tiết kiệm {formatMoney(savings)} ({percentOff}%)
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Thời gian (tùy chọn) */}
          <Box>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.75 }}>Thời gian áp dụng (tùy chọn)</Typography>
            <Stack direction="row" gap={1.5}>
              <TextField
                fullWidth type="date" label="Bắt đầu" value={startAt}
                InputLabelProps={{ shrink: true }} onChange={(e) => { setStartAt(e.target.value); setError(''); }}
              />
              <TextField
                fullWidth type="date" label="Kết thúc" value={endAt}
                InputLabelProps={{ shrink: true }} onChange={(e) => { setEndAt(e.target.value); setError(''); }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              Để trống nếu muốn áp dụng ngay và không giới hạn thời gian.
            </Typography>
          </Box>
        </Stack>
      </Screen>

      {/* Thanh hành động cố định */}
      <Box
        sx={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, bgcolor: '#fff', borderTop: '1px solid #EEF0F2',
          px: 2, pt: 1.5, pb: 'calc(env(safe-area-inset-bottom) + 12px)', zIndex: 20,
        }}
      >
        <Stack gap={1}>
          <Button fullWidth variant="contained" size="large" onClick={submit} disabled={busy}>
            {apply.isPending ? <CircularProgress size={22} color="inherit" /> : 'Áp dụng khuyến mãi'}
          </Button>
          {hasPromotion && (
            <Button fullWidth variant="text" color="error" onClick={() => removePromo.mutate()} disabled={busy}>
              {removePromo.isPending ? <CircularProgress size={20} color="inherit" /> : 'Gỡ khuyến mãi'}
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function TypeToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      component="button" type="button" onClick={onClick}
      sx={{
        flex: 1, border: 0, cursor: 'pointer', py: 1, borderRadius: '9px', fontSize: 14, fontWeight: 700,
        bgcolor: active ? '#fff' : 'transparent', color: active ? 'primary.main' : 'text.secondary',
        boxShadow: active ? '0 1px 3px rgba(16,24,40,0.12)' : 'none', transition: 'all 150ms',
      }}
    >
      {label}
    </Box>
  );
}
