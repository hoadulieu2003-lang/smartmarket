import { Box, Button, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Star, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost, errCode, errMsg, uploadImages } from '@/services/api';
import { EmptyState, Screen, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import type { Img } from '@/types';

const MAX_IMAGES = 6;
const RATING_LABELS: Record<number, string> = {
  1: 'Rất tệ',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Tuyệt vời',
};

export function ReviewCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const productId = sp.get('productId');

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<Img[]>([]);

  const submit = useMutation({
    mutationFn: () =>
      apiPost('/reviews', {
        productId,
        rating,
        content: content.trim() || undefined,
        images,
      }),
    onSuccess: () => {
      // Cache catalog/đánh giá được kéo dài → phải invalidate để thấy đánh giá vừa gửi.
      qc.invalidateQueries({ queryKey: ['product-reviews', productId] });
      qc.invalidateQueries({ queryKey: ['product', productId] });
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      toast.success('Đã gửi đánh giá, cảm ơn bạn!');
      navigate(-1);
    },
    onError: (e) => {
      const code = errCode(e);
      if (code === 'REVIEW_NOT_PURCHASED') return toast.error('Bạn cần mua sản phẩm trước khi đánh giá');
      if (code === 'DUPLICATE_CODE') return toast.error('Bạn đã đánh giá sản phẩm này rồi');
      toast.error(errMsg(e));
    },
  });

  if (!productId) {
    return (
      <Box>
        <TopBar title="Đánh giá sản phẩm" onBack />
        <Screen>
          <EmptyState title="Thiếu thông tin sản phẩm" hint="Hãy mở lại từ trang sản phẩm hoặc đơn hàng để đánh giá." />
        </Screen>
      </Box>
    );
  }

  return (
    <Box>
      <TopBar title="Đánh giá sản phẩm" onBack />
      <Screen>
        <Stack gap={2.5}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
              Bạn thấy sản phẩm này thế nào?
            </Typography>
            <Stack direction="row" gap={0.5} justifyContent="center">
              {[1, 2, 3, 4, 5].map((n) => (
                <IconButton key={n} onClick={() => setRating(n)} aria-label={`${n} sao`} sx={{ p: 0.5 }}>
                  <Star size={38} color="#F59E0B" fill={n <= rating ? '#F59E0B' : 'transparent'} strokeWidth={1.75} />
                </IconButton>
              ))}
            </Stack>
            <Typography variant="body2" color="primary.main" fontWeight={600} mt={0.5}>
              {RATING_LABELS[rating] ?? ''}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" mb={0.75}>Nội dung đánh giá</Typography>
            <TextField
              fullWidth multiline minRows={4} placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 2000))}
              inputProps={{ maxLength: 2000 }}
            />
            <Typography variant="caption" color="text.secondary" display="block" textAlign="right" mt={0.5}>
              {content.length}/2000
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" mb={0.75}>Hình ảnh (tuỳ chọn)</Typography>
            <ImageUploader images={images} onChange={setImages} />
          </Box>

          <Button
            variant="contained" size="large" fullWidth
            disabled={submit.isPending}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </Stack>
      </Screen>
    </Box>
  );
}

/** Chọn & tải ảnh (tối đa 6, dùng chung API uploadImages). */
function ImageUploader({ images, onChange }: { images: Img[]; onChange: (imgs: Img[]) => void }) {
  const [busy, setBusy] = useState(false);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return toast.error(`Chỉ được thêm tối đa ${MAX_IMAGES} ảnh`);
    setBusy(true);
    try {
      const uploaded = await uploadImages(files.slice(0, room));
      onChange([...images, ...uploaded]);
    } catch (err) {
      toast.error(errMsg(err, 'Tải ảnh thất bại'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {images.map((img, i) => (
        <Box key={img.url} sx={{ position: 'relative', width: 76, height: 76, borderRadius: 2, overflow: 'hidden', border: '1px solid #EEF0F2' }}>
          <Box component="img" src={img.url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <IconButton
            size="small" aria-label="Xoá ảnh"
            onClick={() => onChange(images.filter((_, j) => j !== i))}
            sx={{ position: 'absolute', top: 2, right: 2, p: 0.25, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' } }}
          >
            <X size={14} />
          </IconButton>
        </Box>
      ))}
      {images.length < MAX_IMAGES && (
        <Box
          component="label"
          sx={{ width: 76, height: 76, borderRadius: 2, border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: busy ? 'default' : 'pointer', color: 'text.secondary' }}
        >
          {busy ? <CircularProgress size={20} /> : <ImagePlus size={22} />}
          {!busy && <Typography variant="caption">Thêm</Typography>}
          <input type="file" hidden multiple accept="image/*" onChange={pick} disabled={busy} />
        </Box>
      )}
    </Stack>
  );
}
