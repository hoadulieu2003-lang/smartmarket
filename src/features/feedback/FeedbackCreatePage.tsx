import { Box, Button, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost, errMsg, uploadImages } from '@/services/api';
import { EmptyState, Screen, Sheet, TopBar } from '@/components/ui/bits';
import { toast } from '@/hooks';
import { useAuth } from '@/stores';
import { COMPLAINT_TYPE } from '@/utils';
import type { ComplaintType, Img } from '@/types';

const MAX_IMAGES = 6;
const TYPE_OPTIONS = Object.entries(COMPLAINT_TYPE) as [ComplaintType, string][];

export function FeedbackCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const { selectedMarket } = useAuth();

  const marketId = sp.get('marketId') || selectedMarket?.id || '';
  const stallId = sp.get('stallId') || undefined;
  const productId = sp.get('productId') || undefined;

  const [type, setType] = useState<ComplaintType | ''>('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<Img[]>([]);
  const [typeSheet, setTypeSheet] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      apiPost('/complaints', {
        marketId,
        stallId,
        productId,
        type,
        content: content.trim(),
        images,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
      toast.success('Đã gửi phản ánh, cảm ơn bạn!');
      navigate('/feedback');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (!marketId) {
    return (
      <Box>
        <TopBar title="Gửi phản ánh" onBack />
        <Screen>
          <EmptyState
            title="Bạn chưa chọn chợ"
            hint="Hãy chọn khu chợ bạn muốn phản ánh trước khi tiếp tục."
            action={<Button variant="contained" sx={{ mt: 1 }} onClick={() => navigate('/markets')}>Chọn chợ</Button>}
          />
        </Screen>
      </Box>
    );
  }

  const canSubmit = !!type && content.trim().length > 0 && !submit.isPending;

  return (
    <Box>
      <TopBar title="Gửi phản ánh" onBack />
      <Screen>
        <Stack gap={2.25}>
          <Box>
            <Typography variant="subtitle2" mb={0.75}>Loại phản ánh</Typography>
            <Box
              component="button" onClick={() => setTypeSheet(true)}
              sx={{ width: '100%', textAlign: 'left', bgcolor: '#fff', border: '1px solid #D1D5DB', borderRadius: 2, px: 1.75, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            >
              <Typography variant="body2" flex={1} color={type ? 'text.primary' : 'text.secondary'}>
                {type ? COMPLAINT_TYPE[type] : 'Chọn loại phản ánh'}
              </Typography>
              <ChevronRight size={18} color="#9CA3AF" />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" mb={0.75}>
              Nội dung <Typography component="span" color="error.main">*</Typography>
            </Typography>
            <TextField
              fullWidth multiline minRows={5} placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              inputProps={{ maxLength: 5000 }}
            />
            <Typography variant="caption" color="text.secondary" display="block" textAlign="right" mt={0.5}>
              {content.length}/5000
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" mb={0.75}>Hình ảnh (tuỳ chọn)</Typography>
            <ImageUploader images={images} onChange={setImages} />
          </Box>

          <Button variant="contained" size="large" fullWidth disabled={!canSubmit} onClick={() => submit.mutate()}>
            {submit.isPending ? 'Đang gửi...' : 'Gửi phản ánh'}
          </Button>
        </Stack>
      </Screen>

      <Sheet open={typeSheet} onClose={() => setTypeSheet(false)} title="Loại phản ánh">
        <Stack>
          {TYPE_OPTIONS.map(([value, label]) => (
            <Box
              key={value} component="button"
              onClick={() => { setType(value); setTypeSheet(false); }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', textAlign: 'left', border: 0, bgcolor: 'transparent', py: 1.5, px: 0.5, cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
            >
              <Typography variant="body2" flex={1} fontWeight={type === value ? 700 : 400}>{label}</Typography>
              {type === value && <Check size={18} color="#16A34A" />}
            </Box>
          ))}
        </Stack>
      </Sheet>
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
