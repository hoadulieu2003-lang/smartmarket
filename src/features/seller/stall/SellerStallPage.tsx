import {
  Box, Button, Card, CircularProgress, Dialog, IconButton, Stack, TextField, Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, CalendarDays, Clock, ImagePlus, MapPin, Pencil, Phone, Receipt, Store, Tag, X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { apiGet, apiPut, errMsg, uploadImages } from '@/services/api';
import { ErrorState, Field, LoadingScreen, Money, Screen, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { formatDate } from '@/utils';
import type { Img, Stall } from '@/types';

const IMG_FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23F3F4F6"/></svg>';
const MAX_IMAGES = 6;

/** Trường quản lý ảnh sạp (upload + xóa). */
function ImagesField({ images, onChange }: { images: Img[]; onChange: (next: Img[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
    setUploading(true);
    try {
      const uploaded = await uploadImages(Array.from(files).slice(0, room));
      onChange([...images, ...uploaded]);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
        Hình ảnh sạp ({images.length}/{MAX_IMAGES})
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {images.map((img, i) => (
          <Box key={`${img.url}-${i}`} sx={{ position: 'relative', width: 76, height: 76 }}>
            <Box component="img" src={img.url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2, border: '1px solid #EEF0F2' }} />
            <IconButton
              size="small" aria-label="Xóa ảnh"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#fff', border: '1px solid #E5E7EB', p: 0.25, '&:hover': { bgcolor: '#fff' } }}
            >
              <X size={14} />
            </IconButton>
          </Box>
        ))}
        {images.length < MAX_IMAGES && (
          <Box
            component="button" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            sx={{
              width: 76, height: 76, borderRadius: 2, border: '1px dashed #CBD5E1', bgcolor: '#F9FAFB',
              color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 0.5, cursor: 'pointer',
            }}
          >
            {uploading ? <CircularProgress size={18} /> : <><ImagePlus size={20} /><Box component="span" sx={{ fontSize: 11 }}>Thêm</Box></>}
          </Box>
        )}
      </Stack>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
    </Box>
  );
}

interface FormState { name: string; description: string; phone: string; openHours: string; images: Img[] }

export function SellerStallPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['seller-stall'], queryFn: () => apiGet<Stall>('/seller/stall') });
  const stall = q.data;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', description: '', phone: '', openHours: '', images: [] });
  const [nameErr, setNameErr] = useState('');

  function openEdit() {
    if (!stall) return;
    setForm({
      name: stall.name ?? '',
      description: stall.description ?? '',
      phone: stall.phone ?? '',
      openHours: stall.openHours ?? '',
      images: stall.images ?? [],
    });
    setNameErr('');
    setEditing(true);
  }

  const save = useMutation({
    mutationFn: () =>
      apiPut('/seller/stall', {
        name: form.name.trim(),
        description: form.description.trim(),
        phone: form.phone.trim(),
        openHours: form.openHours.trim(),
        images: form.images,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-stall'] });
      toast.success('Đã cập nhật sạp');
      setEditing(false);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  function submit() {
    if (!form.name.trim()) return setNameErr('Vui lòng nhập tên sạp');
    setNameErr('');
    save.mutate();
  }

  const contract = stall?.contract;
  const expiringSoon = contract?.daysLeft != null && contract.daysLeft <= 30;

  return (
    <Box>
      <TopBar title="Sạp của tôi" onBack right={stall ? <IconButton size="small" onClick={openEdit} aria-label="Chỉnh sửa"><Pencil size={18} /></IconButton> : undefined} />

      {q.isLoading ? (
        <LoadingScreen height={320} />
      ) : q.isError || !stall ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : (
        <Screen>
          {/* Ảnh + tên sạp */}
          <Card sx={{ overflow: 'hidden', mb: 1.5 }}>
            <Box sx={{ aspectRatio: '16/9', bgcolor: '#F3F4F6' }}>
              <Box component="img" src={stall.images?.[0]?.url || IMG_FALLBACK} alt={stall.name ?? stall.code} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <Box sx={{ p: 1.75 }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Store size={20} color="#16A34A" />
                <Typography variant="h6" flex={1} minWidth={0} noWrap>{stall.name || `Sạp ${stall.code}`}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">Mã sạp: {stall.code}</Typography>
            </Box>
          </Card>

          {/* Thông tin sạp */}
          <Card sx={{ p: 1.75, mb: 1.5 }}>
            <Stack gap={1.5}>
              <Row icon={<MapPin size={18} />} label="Khu vực" value={stall.zones?.name ?? '—'} />
              <Row icon={<Tag size={18} />} label="Ngành hàng" value={stall.categories?.name ?? 'Kinh doanh tổng hợp'} />
              <Row icon={<Clock size={18} />} label="Giờ bán" value={stall.openHours || '—'} />
              <Row icon={<Phone size={18} />} label="Số điện thoại" value={stall.phone || '—'} />
              <Row icon={<Store size={18} />} label="Mô tả" value={stall.description || 'Chưa có mô tả'} />
            </Stack>
          </Card>

          {/* Hợp đồng */}
          {contract && (
            <Card sx={{ p: 1.75 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <Receipt size={18} color="#16A34A" />
                <Typography variant="subtitle2">Hợp đồng thuê sạp</Typography>
              </Stack>
              {expiringSoon && (
                <Stack direction="row" alignItems="center" gap={1} sx={{ bgcolor: 'rgba(245,158,11,0.12)', color: '#B45309', borderRadius: 2, px: 1.25, py: 1, mb: 1.5 }}>
                  <AlertTriangle size={18} />
                  <Typography variant="caption" fontWeight={600}>
                    Hợp đồng sắp hết hạn — còn {contract.daysLeft} ngày
                  </Typography>
                </Stack>
              )}
              <Stack gap={1.5}>
                <Row icon={<CalendarDays size={18} />} label="Bắt đầu" value={formatDate(contract.startDate)} />
                <Row icon={<CalendarDays size={18} />} label="Hết hạn" value={contract.endDate ? formatDate(contract.endDate) : 'Không thời hạn'} />
                <Row icon={<Receipt size={18} />} label="Phí thuê" value={<Money value={contract.fee} />} />
              </Stack>
            </Card>
          )}

          <Button fullWidth variant="outlined" startIcon={<Pencil size={18} />} sx={{ mt: 2 }} onClick={openEdit}>
            Chỉnh sửa thông tin sạp
          </Button>
        </Screen>
      )}

      {/* Form chỉnh sửa */}
      <Dialog fullScreen open={editing} onClose={() => setEditing(false)}>
        <Stack sx={{ height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 1, borderBottom: '1px solid #EEF0F2', minHeight: 52 }}>
            <IconButton size="small" onClick={() => setEditing(false)} aria-label="Đóng"><X size={20} /></IconButton>
            <Typography variant="subtitle1" flex={1}>Chỉnh sửa sạp</Typography>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
            <Stack gap={2}>
              <TextField
                label="Tên sạp" fullWidth value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={!!nameErr} helperText={nameErr}
              />
              <TextField
                label="Số điện thoại" fullWidth value={form.phone} placeholder="VD: 0901234567"
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <TextField
                label="Giờ bán" fullWidth value={form.openHours} placeholder="VD: 6:00 - 18:00"
                onChange={(e) => setForm((f) => ({ ...f, openHours: e.target.value }))}
              />
              <TextField
                label="Mô tả" fullWidth multiline minRows={3} value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <ImagesField images={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
            </Stack>
          </Box>

          <Box sx={{ px: 2, py: 1.5, pb: 'calc(env(safe-area-inset-bottom) + 12px)', borderTop: '1px solid #EEF0F2' }}>
            <Button
              fullWidth variant="contained" size="large" onClick={submit} disabled={save.isPending}
              startIcon={save.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {save.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Box>
        </Stack>
      </Dialog>
    </Box>
  );
}

/** Dòng thông tin có icon. */
function Row({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Stack direction="row" gap={1.25} alignItems="flex-start">
      <Box sx={{ color: 'text.secondary', mt: 0.25 }}>{icon}</Box>
      <Box flex={1} minWidth={0}>
        <Field label={label}>{value}</Field>
      </Box>
    </Stack>
  );
}
