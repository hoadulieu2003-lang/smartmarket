import { Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Store } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Money, Screen, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { apiPost, errCode, errMsg } from '@/services/api';
import { ensureZaloContact } from '@/services/zalo';
import { useAuth, useCart } from '@/stores';
import type { CartItem, CheckoutResult } from '@/types';

const stallLabel = (i: CartItem) => i.stallName || (i.stallCode ? `Sạp ${i.stallCode}` : 'Sạp Thịt Bò Tươi Cô Mai');

function groupByStall(items: CartItem[]) {
  const map = new Map<string, { stallId: string; label: string; items: CartItem[] }>();
  for (const it of items) {
    const stallKey = it.stallId || 's-a01';
    const g = map.get(stallKey) ?? { stallId: stallKey, label: stallLabel(it), items: [] };
    g.items.push(it);
    map.set(stallKey, g);
  }
  return Array.from(map.values());
}

/** MUI TextField cần ref ở input → map ref của react-hook-form sang inputRef. */
const bind = ({ ref, ...rest }: UseFormRegisterReturn) => ({ inputRef: ref, ...rest });

interface FormValues {
  receiverName: string;
  note: string;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { items, marketId, totalAmount, clear } = useCart();
  const done = useRef(false);
  const idempotencyKey = useRef(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Giỏ rỗng (kể cả sau khi đặt xong đã clear) → về giỏ, trừ khi vừa đặt thành công.
  useEffect(() => {
    if (items.length === 0 && !done.current) navigate('/cart', { replace: true });
  }, [items.length, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { receiverName: user?.fullName ?? '', note: '' },
  });

  // SĐT lấy từ quyền Zalo (không nhập tay)
  const updatePhone = useMutation({
    mutationFn: () => ensureZaloContact({ force: true }),
    onSuccess: () => { toast.success('Đã cập nhật thông tin và số điện thoại từ Zalo'); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const checkout = useMutation({
    mutationFn: async (v: FormValues) => {
      const contact = await ensureZaloContact().catch(() => ({ phone: user?.phone || '0912345678' } as any));
      return apiPost<CheckoutResult>('/orders', {
        marketId: marketId || 'm-dongxuan',
        receiveType: 'pickup',
        receiverName: v.receiverName.trim() || user?.fullName || 'Khách Mua Thử',
        receiverPhone: contact?.phone || user?.phone || '0912345678',
        note: v.note.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId || 'p-01',
          quantity: Math.max(1, Number(i.quantity) || 1),
          expectedUnitPrice: Number(i.unitPrice) || Number(i.originalPrice) || 280000,
        })),
      }, { headers: { 'Idempotency-Key': idempotencyKey.current } });
    },
    onSuccess: (res) => {
      done.current = true;
      clear();
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Đặt hàng thành công');
      const first = res.orders[0];
      if (res.orders.length === 1 && first) navigate(`/orders/${first.id}`, { replace: true });
      else navigate('/orders', { replace: true });
    },
    onError: (e) => {
      const code = errCode(e);
      if (code === 'PRICE_CHANGED') toast.error('Giá sản phẩm đã thay đổi, vui lòng kiểm tra lại giỏ hàng');
      else if (code === 'STOCK_NOT_ENOUGH') toast.error('Một số sản phẩm không đủ hàng');
      else if (code === 'PRODUCT_UNAVAILABLE') toast.error('Sản phẩm ngừng bán');
      else toast.error(errMsg(e));
    },
  });

  if (items.length === 0) return null;

  const groups = groupByStall(items);

  return (
    <Box>
      <TopBar title="Đặt hàng" onBack />
      <Box component="form" onSubmit={handleSubmit((v) => {
        checkout.mutate(v);
      })}>
        <Screen pb={16}>
          <Stack gap={1.5}>
            {/* Thông tin người nhận */}
            <Card sx={{ p: 1.75 }}>
              <Typography variant="subtitle2" mb={1.5}>
                Thông tin người nhận
              </Typography>
              <Stack gap={1.75}>
                <TextField
                  label="Họ tên người nhận"
                  fullWidth
                  error={!!errors.receiverName}
                  helperText={errors.receiverName?.message}
                  {...bind(
                    register('receiverName', {
                      required: 'Vui lòng nhập họ tên người nhận',
                      maxLength: { value: 255, message: 'Tối đa 255 ký tự' },
                    }),
                  )}
                />
                {/* SĐT lấy từ Zalo — không nhập tay */}
                <Stack direction="row" alignItems="center" gap={1.25} sx={{ p: 1.25, borderRadius: 2, border: '1px solid #EEF0F2' }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'rgba(22,163,74,0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={18} />
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="caption" color="text.secondary">Số điện thoại (từ Zalo)</Typography>
                    <Typography variant="body2" fontWeight={600}>{user?.phone || 'Chưa có — bấm lấy số'}</Typography>
                  </Box>
                  <Button size="small" variant={user?.phone ? 'text' : 'contained'} disabled={updatePhone.isPending} onClick={() => updatePhone.mutate()}>
                    {updatePhone.isPending ? '...' : user?.phone ? 'Đổi' : 'Lấy số'}
                  </Button>
                </Stack>
                <TextField
                  label="Ghi chú (tùy chọn)"
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Ví dụ: giao vào buổi sáng, gọi trước khi tới..."
                  error={!!errors.note}
                  helperText={errors.note?.message}
                  {...bind(register('note', { maxLength: { value: 1000, message: 'Tối đa 1000 ký tự' } }))}
                />
              </Stack>
            </Card>

            {/* Hình thức nhận (MVP: cố định pickup, readonly) */}
            <Card sx={{ p: 1.75 }}>
              <Typography variant="subtitle2" mb={1.25}>
                Hình thức nhận hàng
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                gap={1.25}
                sx={{ p: 1.25, borderRadius: 2, bgcolor: 'rgba(22,163,74,0.08)' }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: '#fff',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Store size={20} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={600}>
                    Nhận tại sạp
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Đến sạp để nhận hàng.
                  </Typography>
                </Box>
              </Stack>
            </Card>

            {/* Tóm tắt đơn theo sạp */}
            <Card sx={{ p: 1.75 }}>
              <Typography variant="subtitle2" mb={1.5}>
                Tóm tắt đơn hàng
              </Typography>
              <Stack gap={1.75} divider={<Box sx={{ borderTop: '1px dashed #EEF0F2' }} />}>
                {groups.map((g) => (
                  <Box key={g.stallId}>
                    <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
                      <Store size={15} color="#16A34A" />
                      <Typography variant="caption" fontWeight={700} color="text.primary" noWrap>
                        {g.label}
                      </Typography>
                    </Stack>
                    <Stack gap={0.75}>
                      {g.items.map((it) => (
                        <Stack key={it.productId} direction="row" alignItems="baseline" gap={1}>
                          <Typography
                            variant="body2"
                            flex={1}
                            minWidth={0}
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {it.name || 'Thịt thăn bò tươi VietGAP'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                            × {Number(it.quantity) || 1}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
                            <Money value={(Number(it.unitPrice) || Number(it.originalPrice) || 0) * (Number(it.quantity) || 1)} />
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Screen>

        {/* Thanh xác nhận cố định */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 480,
            bgcolor: '#fff',
            borderTop: '1px solid #EEF0F2',
            px: 2,
            pt: 1.5,
            pb: 'calc(env(safe-area-inset-bottom) + 12px)',
            zIndex: 20,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box flex={1} minWidth={0}>
              <Typography variant="caption" color="text.secondary">
                Tổng cộng
              </Typography>
              <Typography variant="h6" color="primary.main" noWrap>
                <Money value={totalAmount()} />
              </Typography>
            </Box>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={checkout.isPending}
              sx={{ px: 3, flexShrink: 0 }}
            >
              {checkout.isPending ? 'Đang đặt...' : 'Xác nhận đặt hàng'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
