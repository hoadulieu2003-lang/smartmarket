import { Box, Button, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { Check, ChevronRight, ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { apiPost, apiPut, errCode, errMsg, uploadImages } from '@/services/api';
import { Sheet } from '@/components/ui/bits';
import { toast, useCategories } from '@/hooks';
import type { Img } from '@/types';

const MAX_DOCS = 6;
const PHONE_RE = /^0\d{9}$/;

export interface ApplyValues {
  categoryId: string | null;
  fullName: string;
  phone: string;
  idNumber: string;
  businessDescription: string;
  desiredStallNote: string;
  documents: Img[];
}

/** Form hồ sơ tiểu thương — dùng chung cho đăng ký mới (create) và bổ sung (edit). */
export function ApplicationForm({
  mode,
  marketName,
  marketId,
  initial,
  editLabel,
  onDone,
}: {
  mode: 'create' | 'edit';
  marketName: string;
  marketId?: string;
  initial?: Partial<ApplyValues>;
  editLabel?: string;
  onDone: () => void;
}) {
  const categories = useCategories();

  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [idNumber, setIdNumber] = useState(initial?.idNumber ?? '');
  const [businessDescription, setBusinessDescription] = useState(initial?.businessDescription ?? '');
  const [desiredStallNote, setDesiredStallNote] = useState(initial?.desiredStallNote ?? '');
  const [documents, setDocuments] = useState<Img[]>(initial?.documents ?? []);
  const [catSheet, setCatSheet] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryName = categories.data?.find((c) => c.id === categoryId)?.name;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên';
    if (!PHONE_RE.test(phone.trim())) e.phone = 'Số điện thoại phải gồm 10 số, bắt đầu bằng 0';
    const idLen = idNumber.trim().length;
    if (idLen < 9 || idLen > 20) e.idNumber = 'Số CCCD/CMND không hợp lệ';
    if (documents.length < 1) e.documents = 'Cần tối thiểu 1 ảnh giấy tờ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const submit = useMutation({
    mutationFn: () => {
      const base = {
        categoryId: categoryId ?? undefined,
        fullName: fullName.trim(),
        phone: phone.trim(),
        idNumber: idNumber.trim(),
        businessDescription: businessDescription.trim() || undefined,
        desiredStallNote: desiredStallNote.trim() || undefined,
        documents,
      };
      return mode === 'create'
        ? apiPost('/merchant-applications', { marketId, ...base })
        : apiPut('/my/merchant-application', base);
    },
    onSuccess: () => {
      toast.success(mode === 'create' ? 'Đã gửi hồ sơ đăng ký' : 'Đã gửi lại hồ sơ');
      onDone();
    },
    onError: (err) => {
      if (errCode(err) === 'APPLICATION_EXISTS') return toast.error('Bạn đã có hồ sơ hoặc đã là tiểu thương');
      toast.error(errMsg(err));
    },
  });

  function onSubmit() {
    if (!validate()) return;
    submit.mutate();
  }

  return (
    <>
      <Stack gap={2}>
        <Labeled label="Chợ đăng ký">
          <Box sx={{ bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 2, px: 1.75, py: 1.5 }}>
            <Typography variant="body2" fontWeight={500}>{marketName || '—'}</Typography>
          </Box>
        </Labeled>

        <Labeled label="Ngành hàng kinh doanh">
          <SelectRow
            placeholder="Chọn ngành hàng (tuỳ chọn)"
            value={categoryName}
            onClick={() => setCatSheet(true)}
          />
        </Labeled>

        <Labeled label="Họ và tên" required error={errors.fullName}>
          <TextField
            fullWidth size="small" placeholder="Nguyễn Văn A" value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={!!errors.fullName}
          />
        </Labeled>

        <Labeled label="Số điện thoại" required error={errors.phone}>
          <TextField
            fullWidth size="small" type="tel" placeholder="09xxxxxxxx" value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            error={!!errors.phone}
          />
        </Labeled>

        <Labeled label="Số CCCD/CMND" required error={errors.idNumber}>
          <TextField
            fullWidth size="small" placeholder="Số căn cước công dân" value={idNumber}
            onChange={(e) => setIdNumber(e.target.value.slice(0, 20))}
            error={!!errors.idNumber}
          />
        </Labeled>

        <Labeled label="Mô tả mặt hàng kinh doanh">
          <TextField
            fullWidth size="small" multiline minRows={3}
            placeholder="Bạn dự định kinh doanh mặt hàng gì?"
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value.slice(0, 5000))}
          />
        </Labeled>

        <Labeled label="Nguyện vọng về sạp">
          <TextField
            fullWidth size="small" multiline minRows={2}
            placeholder="Vị trí, diện tích sạp mong muốn..."
            value={desiredStallNote}
            onChange={(e) => setDesiredStallNote(e.target.value.slice(0, 2000))}
          />
        </Labeled>

        <Labeled label="Ảnh giấy tờ" required error={errors.documents}>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
            Ảnh CCCD/CMND, giấy phép kinh doanh (nếu có)
          </Typography>
          <DocUploader documents={documents} onChange={setDocuments} />
        </Labeled>

        <Button variant="contained" size="large" fullWidth disabled={submit.isPending} onClick={onSubmit}>
          {submit.isPending ? 'Đang gửi...' : mode === 'create' ? 'Gửi hồ sơ' : editLabel ?? 'Bổ sung & gửi lại'}
        </Button>
      </Stack>

      <Sheet open={catSheet} onClose={() => setCatSheet(false)} title="Ngành hàng kinh doanh">
        <Stack sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {(categories.data ?? []).map((c) => (
            <Box
              key={c.id} component="button"
              onClick={() => { setCategoryId(c.id); setCatSheet(false); }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', textAlign: 'left', border: 0, bgcolor: 'transparent', py: 1.5, px: 0.5, cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
            >
              <Typography variant="body2" flex={1} fontWeight={categoryId === c.id ? 700 : 400}>{c.name}</Typography>
              {categoryId === c.id && <Check size={18} color="#16A34A" />}
            </Box>
          ))}
        </Stack>
      </Sheet>
    </>
  );
}

function Labeled({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" mb={0.75}>
        {label} {required && <Typography component="span" color="error.main">*</Typography>}
      </Typography>
      {children}
      {error && <Typography variant="caption" color="error.main" display="block" mt={0.5}>{error}</Typography>}
    </Box>
  );
}

function SelectRow({ value, placeholder, onClick }: { value?: string; placeholder: string; onClick: () => void }) {
  return (
    <Box
      component="button" onClick={onClick}
      sx={{ width: '100%', textAlign: 'left', bgcolor: '#fff', border: '1px solid #D1D5DB', borderRadius: 2, px: 1.75, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
    >
      <Typography variant="body2" flex={1} color={value ? 'text.primary' : 'text.secondary'}>
        {value || placeholder}
      </Typography>
      <ChevronRight size={18} color="#9CA3AF" />
    </Box>
  );
}

/** Tải ảnh giấy tờ (tối đa 6, dùng chung API uploadImages). */
function DocUploader({ documents, onChange }: { documents: Img[]; onChange: (imgs: Img[]) => void }) {
  const [busy, setBusy] = useState(false);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    const room = MAX_DOCS - documents.length;
    if (room <= 0) return toast.error(`Chỉ được thêm tối đa ${MAX_DOCS} ảnh`);
    setBusy(true);
    try {
      const uploaded = await uploadImages(files.slice(0, room));
      onChange([...documents, ...uploaded]);
    } catch (err) {
      toast.error(errMsg(err, 'Tải ảnh thất bại'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {documents.map((img, i) => (
        <Box key={img.url} sx={{ position: 'relative', width: 76, height: 76, borderRadius: 2, overflow: 'hidden', border: '1px solid #EEF0F2' }}>
          <Box component="img" src={img.url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <IconButton
            size="small" aria-label="Xoá ảnh"
            onClick={() => onChange(documents.filter((_, j) => j !== i))}
            sx={{ position: 'absolute', top: 2, right: 2, p: 0.25, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' } }}
          >
            <X size={14} />
          </IconButton>
        </Box>
      ))}
      {documents.length < MAX_DOCS && (
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
