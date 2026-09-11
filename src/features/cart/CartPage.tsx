import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material';
import { Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, Money, Screen, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { errMsg } from '@/services/api';
import { ensureZaloContact } from '@/services/zalo';
import { useCart } from '@/stores';
import type { CartItem } from '@/types';

const IMG_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="%23F3F4F6"/></svg>';

const stallLabel = (i: CartItem) => i.stallName || (i.stallCode ? `Sạp ${i.stallCode}` : 'Sạp');

/** Gom item theo sạp (mỗi sạp = một nhóm) để hiển thị giống hóa đơn. */
function groupByStall(items: CartItem[]) {
  const map = new Map<string, { stallId: string; label: string; items: CartItem[] }>();
  for (const it of items) {
    const g = map.get(it.stallId) ?? { stallId: it.stallId, label: stallLabel(it), items: [] };
    g.items.push(it);
    map.set(it.stallId, g);
  }
  return Array.from(map.values());
}

/** Bộ đếm số lượng +/- (dùng setQty của store — giảm về 0 sẽ tự xóa item). */
function QtyStepper({ qty, atMax, onDec, onInc }: { qty: number; atMax: boolean; onDec: () => void; onInc: () => void }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
      <IconButton size="small" onClick={onDec} aria-label="Giảm số lượng" sx={{ borderRadius: 0 }}>
        <Minus size={16} />
      </IconButton>
      <Typography variant="body2" fontWeight={700} sx={{ minWidth: 34, textAlign: 'center' }}>
        {qty}
      </Typography>
      <IconButton size="small" onClick={onInc} disabled={atMax} aria-label="Tăng số lượng" sx={{ borderRadius: 0 }}>
        <Plus size={16} />
      </IconButton>
    </Stack>
  );
}

function CartRow({
  item,
  onQty,
  onRemove,
}: {
  item: CartItem;
  onQty: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  const discounted = item.originalPrice > item.unitPrice;
  const atMax = item.quantity >= item.maxQuantity;
  return (
    <Stack direction="row" gap={1.25}>
      <Box
        component="img"
        src={item.image || IMG_FALLBACK}
        alt={item.name}
        sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover', flexShrink: 0, bgcolor: '#F3F4F6' }}
      />
      <Box flex={1} minWidth={0}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {item.name}
        </Typography>
        <Stack direction="row" alignItems="baseline" gap={0.75} mt={0.25}>
          <Typography component="span" variant="body2" color="primary.main" fontWeight={700}>
            <Money value={item.unitPrice} />
          </Typography>
          <Typography component="span" variant="caption" color="text.secondary">
            /{item.unit}
          </Typography>
          {discounted && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
              <Money value={item.originalPrice} />
            </Typography>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.75}>
          <QtyStepper
            qty={item.quantity}
            atMax={atMax}
            onDec={() => onQty(item.productId, item.quantity - 1)}
            onInc={() => onQty(item.productId, item.quantity + 1)}
          />
          <Stack direction="row" alignItems="center" gap={0.25}>
            <Typography variant="subtitle2" fontWeight={700}>
              <Money value={item.unitPrice * item.quantity} />
            </Typography>
            <IconButton size="small" onClick={() => onRemove(item.productId)} aria-label={`Xóa ${item.name}`}>
              <Trash2 size={18} color="#9CA3AF" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

export function CartPage() {
  const navigate = useNavigate();
  const { items, setQty, remove, totalAmount } = useCart();
  const [continuing, setContinuing] = useState(false);

  async function goToCheckout() {
    setContinuing(true);
    try {
      await ensureZaloContact();
      navigate('/checkout');
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setContinuing(false);
    }
  }

  if (items.length === 0) {
    return (
      <Box>
        <TopBar title="Giỏ hàng" onBack />
        <Screen>
          <EmptyState
            icon={<ShoppingCart size={40} strokeWidth={1.5} />}
            title="Giỏ hàng trống"
            hint="Chọn sản phẩm từ các sạp trong chợ để bắt đầu mua sắm."
            action={
              <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 1, px: 3 }}>
                Về trang chủ
              </Button>
            }
          />
        </Screen>
      </Box>
    );
  }

  const groups = groupByStall(items);

  return (
    <Box>
      <TopBar title="Giỏ hàng" subtitle={`${items.length} sản phẩm`} onBack />
      <Screen pb={14}>
        <Stack gap={1.5}>
          {groups.map((g) => (
            <Card key={g.stallId} sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" gap={0.75} mb={1.25}>
                <Store size={16} color="#16A34A" />
                <Typography variant="subtitle2" noWrap>
                  {g.label}
                </Typography>
              </Stack>
              <Stack gap={1.75} divider={<Box sx={{ borderTop: '1px dashed #EEF0F2' }} />}>
                {g.items.map((it) => (
                  <CartRow key={it.productId} item={it} onQty={setQty} onRemove={remove} />
                ))}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Screen>

      {/* Thanh tổng cố định */}
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
              Tạm tính
            </Typography>
            <Typography variant="h6" color="primary.main" noWrap>
              <Money value={totalAmount()} />
            </Typography>
          </Box>
          <Button variant="contained" size="large" disabled={continuing} onClick={() => void goToCheckout()} sx={{ px: 4, flexShrink: 0 }}>
            {continuing ? 'Đang xử lý...' : 'Đặt hàng'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
