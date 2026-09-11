import {
  Box, Button, Card, CircularProgress, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, FileSearch, ImagePlus, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut, errMsg, uploadImages } from '@/services/api';
import { LoadingScreen, Screen, Sheet, TopBar } from '@/components/ui/bits';
import { toast, useSellerStall, useSubcategories, usePublicSettings } from '@/hooks';
import { formatMoneyInput } from '@/utils';
import type { Category, Img, Product } from '@/types';

const MAX_IMAGES = 6;
const MAX_TRACE_DOCUMENTS = 6;

type Errors = Partial<Record<
  'name' | 'images' | 'categoryId' | 'price' | 'unit' | 'quantity' |
  'traceProducerName' | 'traceExternalUrl' | 'traceExpiryDate',
  string
>>;

export function SellerProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const traceFileRef = useRef<HTMLInputElement>(null);
  const seeded = useRef(false);

  const [name, setName] = useState('');
  const [images, setImages] = useState<Img[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [origin, setOrigin] = useState('');
  const [description, setDescription] = useState('');
  const [traceEnabled, setTraceEnabled] = useState(false);
  const [traceProducerName, setTraceProducerName] = useState('');
  const [traceProductionAddress, setTraceProductionAddress] = useState('');
  const [traceBatchCode, setTraceBatchCode] = useState('');
  const [traceProductionDate, setTraceProductionDate] = useState('');
  const [traceHarvestDate, setTraceHarvestDate] = useState('');
  const [traceExpiryDate, setTraceExpiryDate] = useState('');
  const [traceCertificateName, setTraceCertificateName] = useState('');
  const [traceCertificateNumber, setTraceCertificateNumber] = useState('');
  const [traceDocuments, setTraceDocuments] = useState<Img[]>([]);
  const [traceExternalUrl, setTraceExternalUrl] = useState('');
  const [traceNotes, setTraceNotes] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingTrace, setUploadingTrace] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [unitOpen, setUnitOpen] = useState(false);

  const stall = useSellerStall();
  const stallCategory = stall.data?.categories ?? null;
  const categories = useSubcategories(stallCategory?.id);
  const settings = usePublicSettings();
  const units = settings.data?.product_units ?? [];

  const detail = useQuery({
    queryKey: ['seller-product', id],
    queryFn: () => apiGet<Product>(`/seller/products/${id}`),
    enabled: isEdit,
  });

  // Prefill khi sửa (chỉ một lần, tránh ghi đè khi người dùng đang nhập).
  useEffect(() => {
    const p = detail.data;
    if (!p || seeded.current) return;
    seeded.current = true;
    setName(p.name);
    setImages(p.images ?? []);
    setCategoryId(p.categoryId);
    setPrice(String(p.price));
    setUnit(p.unit);
    setQuantity(String(p.quantity));
    setOrigin(p.origin ?? '');
    setDescription(p.description ?? '');
    if (p.traceability) {
      setTraceEnabled(true);
      setTraceProducerName(p.traceability.producerName);
      setTraceProductionAddress(p.traceability.productionAddress ?? '');
      setTraceBatchCode(p.traceability.batchCode ?? '');
      setTraceProductionDate(p.traceability.productionDate?.slice(0, 10) ?? '');
      setTraceHarvestDate(p.traceability.harvestDate?.slice(0, 10) ?? '');
      setTraceExpiryDate(p.traceability.expiryDate?.slice(0, 10) ?? '');
      setTraceCertificateName(p.traceability.certificateName ?? '');
      setTraceCertificateNumber(p.traceability.certificateNumber ?? '');
      setTraceDocuments(p.traceability.documents ?? []);
      setTraceExternalUrl(p.traceability.externalUrl ?? '');
      setTraceNotes(p.traceability.notes ?? '');
    }
  }, [detail.data]);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      isEdit ? apiPut(`/seller/products/${id}`, body) : apiPost('/seller/products', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      qc.invalidateQueries({ queryKey: ['seller-dashboard'] });
      if (isEdit) qc.invalidateQueries({ queryKey: ['seller-product', id] });
      toast.success(isEdit ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      navigate('/seller/products');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const createCategory = useMutation({
    mutationFn: (categoryName: string) =>
      apiPost<Category>('/seller/product-categories', { name: categoryName }),
    onSuccess: (category) => {
      if (stallCategory) {
        qc.setQueryData<Category[]>(['categories', 'sub', stallCategory.id], (current = []) => {
          const withoutDuplicate = current.filter((item) => item.id !== category.id);
          return [...withoutDuplicate, category].sort((a, b) => a.displayOrder - b.displayOrder);
        });
      }
      setCategoryId(category.id);
      setNewCategoryName('');
      setErrors((current) => ({ ...current, categoryId: undefined }));
      setCatOpen(false);
      toast.success(`Đã chọn loại mặt hàng “${category.name}”`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  function addCategory() {
    const categoryName = newCategoryName.trim().replace(/\s+/g, ' ');
    if (!categoryName) return toast.error('Nhập tên loại mặt hàng');
    createCategory.mutate(categoryName);
  }

  async function pickImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
    setUploading(true);
    try {
      const uploaded = await uploadImages(Array.from(files).slice(0, room));
      setImages((prev) => [...prev, ...uploaded]);
      setErrors((e) => ({ ...e, images: undefined }));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function pickTraceDocuments(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_TRACE_DOCUMENTS - traceDocuments.length;
    if (room <= 0) return toast.error(`Tối đa ${MAX_TRACE_DOCUMENTS} ảnh giấy tờ`);
    setUploadingTrace(true);
    try {
      const uploaded = await uploadImages(Array.from(files).slice(0, room));
      setTraceDocuments((current) => [...current, ...uploaded]);
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setUploadingTrace(false);
      if (traceFileRef.current) traceFileRef.current.value = '';
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Nhập tên sản phẩm';
    if (images.length === 0) e.images = 'Cần tối thiểu 1 ảnh';
    if (!categoryId) e.categoryId = 'Chọn loại mặt hàng';
    const priceN = Number(price);
    if (!price.trim() || !Number.isInteger(priceN) || priceN <= 0) e.price = 'Giá bán phải là số nguyên lớn hơn 0';
    if (!unit) e.unit = 'Chọn đơn vị bán';
    const qtyN = Number(quantity);
    if (quantity.trim() === '' || !Number.isFinite(qtyN) || qtyN < 0) e.quantity = 'Số lượng tồn phải từ 0 trở lên';
    if (traceEnabled) {
      if (!traceProducerName.trim()) e.traceProducerName = 'Nhập đơn vị sản xuất hoặc cung cấp';
      if (traceExternalUrl.trim()) {
        try {
          const url = new URL(traceExternalUrl.trim());
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        } catch {
          e.traceExternalUrl = 'URL phải bắt đầu bằng http:// hoặc https://';
        }
      }
      const sourceDate = [traceProductionDate, traceHarvestDate].filter(Boolean).sort().at(-1) ?? '';
      if (sourceDate && traceExpiryDate && traceExpiryDate < sourceDate)
        e.traceExpiryDate = 'Hạn sử dụng phải sau ngày sản xuất hoặc thu hoạch';
    }
    return e;
  }

  function submit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }
    save.mutate({
      name: name.trim(),
      images,
      categoryId,
      price: Number(price),
      unit,
      quantity: Number(quantity),
      origin: origin.trim() ? origin.trim() : null,
      description: description.trim() ? description.trim() : null,
      traceability: traceEnabled
        ? {
            producerName: traceProducerName.trim(),
            productionAddress: traceProductionAddress.trim() || null,
            batchCode: traceBatchCode.trim() || null,
            productionDate: traceProductionDate || null,
            harvestDate: traceHarvestDate || null,
            expiryDate: traceExpiryDate || null,
            certificateName: traceCertificateName.trim() || null,
            certificateNumber: traceCertificateNumber.trim() || null,
            documents: traceDocuments,
            externalUrl: traceExternalUrl.trim() || null,
            notes: traceNotes.trim() || null,
          }
        : null,
    });
  }

  const busy = save.isPending;
  const catName = categories.data?.find((c) => c.id === categoryId)?.name ?? '';

  return (
    <Box>
      <TopBar title={isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} onBack />

      {isEdit && detail.isLoading ? (
        <LoadingScreen height={300} />
      ) : (
        <Screen pb={14}>
          <Stack gap={2.5}>
            {/* Ảnh */}
            <Field label="Ảnh sản phẩm" required error={errors.images}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                {images.map((img, i) => (
                  <Box key={img.url} sx={{ position: 'relative', aspectRatio: '1', borderRadius: 2.5, overflow: 'hidden', bgcolor: '#F3F4F6' }}>
                    <Box component="img" src={img.url} alt={`Ảnh ${i + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Box
                      component="button" type="button" aria-label={`Xóa ảnh ${i + 1}`}
                      onClick={() => setImages((prev) => prev.filter((x) => x.url !== img.url))}
                      sx={{
                        position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%',
                        border: 0, cursor: 'pointer', bgcolor: 'rgba(17,24,39,0.65)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </Box>
                  </Box>
                ))}
                {images.length < MAX_IMAGES && (
                  <Box
                    component="button" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    sx={{
                      aspectRatio: '1', borderRadius: 2.5, cursor: uploading ? 'default' : 'pointer',
                      border: '1.5px dashed #CBD5E1', bgcolor: '#FAFAFA', color: 'text.secondary',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                    }}
                  >
                    {uploading ? <CircularProgress size={22} /> : <><ImagePlus size={22} /><Box component="span" sx={{ fontSize: 12 }}>Thêm ảnh</Box></>}
                  </Box>
                )}
              </Box>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => pickImages(e.target.files)} />
            </Field>

            {/* Tên */}
            <Field label="Tên sản phẩm" required error={errors.name}>
              <TextField
                fullWidth hiddenLabel placeholder="VD: Rau muống sạch" value={name}
                error={!!errors.name}
                onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }}
              />
            </Field>

            {/* Loại mặt hàng — thuộc ngành hàng của quầy */}
            <Field label="Loại mặt hàng" required error={errors.categoryId}>
              <PickerButton
                value={catName}
                placeholder={stallCategory ? 'Chọn loại mặt hàng' : 'Quầy chưa có ngành hàng'}
                error={!!errors.categoryId}
                onClick={() => setCatOpen(true)}
              />
              {stallCategory && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Ngành hàng của quầy: {stallCategory.name}
                </Typography>
              )}
            </Field>

            {/* Giá + Đơn vị */}
            <Stack direction="row" gap={1.5}>
              <Box flex={1}>
                <Field label="Giá bán" required error={errors.price}>
                  <TextField
                    fullWidth hiddenLabel placeholder="0" value={formatMoneyInput(price)} error={!!errors.price}
                    inputProps={{ inputMode: 'numeric' }}
                    onChange={(e) => { setPrice(e.target.value.replace(/[^\d]/g, '')); setErrors((x) => ({ ...x, price: undefined })); }}
                    InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary">đ</Typography> }}
                  />
                </Field>
              </Box>
              <Box flex={1}>
                <Field label="Đơn vị" required error={errors.unit}>
                  <PickerButton value={unit} placeholder="Chọn" error={!!errors.unit} onClick={() => setUnitOpen(true)} />
                </Field>
              </Box>
            </Stack>

            {/* Tồn kho */}
            <Field label="Số lượng tồn" required error={errors.quantity}>
              <TextField
                fullWidth hiddenLabel placeholder="0" value={quantity} error={!!errors.quantity}
                inputProps={{ inputMode: 'decimal' }}
                onChange={(e) => { setQuantity(e.target.value.replace(/[^\d.]/g, '')); setErrors((x) => ({ ...x, quantity: undefined })); }}
                InputProps={{ endAdornment: unit ? <Typography variant="body2" color="text.secondary">{unit}</Typography> : undefined }}
              />
            </Field>

            {/* Xuất xứ */}
            <Field label="Xuất xứ">
              <TextField fullWidth hiddenLabel placeholder="VD: Đà Lạt (tùy chọn)" value={origin} onChange={(e) => setOrigin(e.target.value)} />
            </Field>

            {/* Mô tả */}
            <Field label="Mô tả">
              <TextField fullWidth hiddenLabel multiline minRows={3} placeholder="Mô tả sản phẩm (tùy chọn)" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>

            <Card sx={{ p: 1.75, borderColor: traceEnabled ? 'rgba(22,163,74,0.28)' : 'divider' }}>
              <Stack direction="row" alignItems="center" gap={1.25}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: 'rgba(22,163,74,0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileSearch size={20} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700}>Thông tin truy xuất nguồn gốc</Typography>
                  <Typography variant="caption" color="text.secondary">Thông tin do tiểu thương tự cung cấp</Typography>
                </Box>
                <Switch
                  checked={traceEnabled}
                  onChange={(event) => setTraceEnabled(event.target.checked)}
                  inputProps={{ 'aria-label': 'Thêm thông tin truy xuất nguồn gốc' }}
                />
              </Stack>

              {traceEnabled && (
                <Stack gap={2} mt={2}>
                  <Field label="Đơn vị sản xuất/cung cấp" required error={errors.traceProducerName}>
                    <TextField
                      fullWidth hiddenLabel placeholder="VD: Hợp tác xã Rau sạch Đà Lạt"
                      value={traceProducerName} error={!!errors.traceProducerName}
                      onChange={(event) => {
                        setTraceProducerName(event.target.value);
                        setErrors((current) => ({ ...current, traceProducerName: undefined }));
                      }}
                    />
                  </Field>
                  <Field label="Địa chỉ hoặc vùng sản xuất">
                    <TextField fullWidth hiddenLabel placeholder="VD: Phường 8, Đà Lạt, Lâm Đồng" value={traceProductionAddress} onChange={(event) => setTraceProductionAddress(event.target.value)} />
                  </Field>
                  <Field label="Mã lô">
                    <TextField fullWidth hiddenLabel placeholder="VD: DL-2026-0715" value={traceBatchCode} onChange={(event) => setTraceBatchCode(event.target.value)} />
                  </Field>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                    <Field label="Ngày sản xuất">
                      <TextField fullWidth type="date" value={traceProductionDate} onChange={(event) => setTraceProductionDate(event.target.value)} />
                    </Field>
                    <Field label="Ngày thu hoạch">
                      <TextField fullWidth type="date" value={traceHarvestDate} onChange={(event) => setTraceHarvestDate(event.target.value)} />
                    </Field>
                  </Box>
                  <Field label="Hạn sử dụng" error={errors.traceExpiryDate}>
                    <TextField
                      fullWidth type="date" value={traceExpiryDate} error={!!errors.traceExpiryDate}
                      onChange={(event) => {
                        setTraceExpiryDate(event.target.value);
                        setErrors((current) => ({ ...current, traceExpiryDate: undefined }));
                      }}
                    />
                  </Field>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                    <Field label="Tên chứng nhận">
                      <TextField fullWidth hiddenLabel placeholder="VD: VietGAP" value={traceCertificateName} onChange={(event) => setTraceCertificateName(event.target.value)} />
                    </Field>
                    <Field label="Số chứng nhận">
                      <TextField fullWidth hiddenLabel placeholder="Số/ mã chứng nhận" value={traceCertificateNumber} onChange={(event) => setTraceCertificateNumber(event.target.value)} />
                    </Field>
                  </Box>
                  <Field label="Ảnh giấy tờ/chứng nhận">
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                      {traceDocuments.map((document, index) => (
                        <Box key={document.url} sx={{ position: 'relative', aspectRatio: '1', borderRadius: 2.5, overflow: 'hidden', bgcolor: '#F3F4F6' }}>
                          <Box component="img" src={document.url} alt={`Giấy tờ ${index + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <Box
                            component="button" type="button" aria-label={`Xóa giấy tờ ${index + 1}`}
                            onClick={() => setTraceDocuments((current) => current.filter((item) => item.url !== document.url))}
                            sx={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', border: 0, cursor: 'pointer', bgcolor: 'rgba(17,24,39,0.65)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={14} />
                          </Box>
                        </Box>
                      ))}
                      {traceDocuments.length < MAX_TRACE_DOCUMENTS && (
                        <Box
                          component="button" type="button" disabled={uploadingTrace}
                          onClick={() => traceFileRef.current?.click()}
                          sx={{ aspectRatio: '1', borderRadius: 2.5, cursor: uploadingTrace ? 'default' : 'pointer', border: '1.5px dashed #CBD5E1', bgcolor: '#FAFAFA', color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
                        >
                          {uploadingTrace ? <CircularProgress size={22} /> : <><ImagePlus size={22} /><Box component="span" sx={{ fontSize: 12 }}>Thêm giấy tờ</Box></>}
                        </Box>
                      )}
                    </Box>
                    <input ref={traceFileRef} type="file" accept="image/*" multiple hidden onChange={(event) => void pickTraceDocuments(event.target.files)} />
                  </Field>
                  <Field label="URL/QR truy xuất bên ngoài" error={errors.traceExternalUrl}>
                    <TextField
                      fullWidth hiddenLabel placeholder="https://..." value={traceExternalUrl} error={!!errors.traceExternalUrl}
                      inputProps={{ inputMode: 'url' }}
                      onChange={(event) => {
                        setTraceExternalUrl(event.target.value);
                        setErrors((current) => ({ ...current, traceExternalUrl: undefined }));
                      }}
                    />
                  </Field>
                  <Field label="Ghi chú bổ sung">
                    <TextField fullWidth hiddenLabel multiline minRows={3} placeholder="Thông tin bổ sung về nguồn gốc sản phẩm" value={traceNotes} onChange={(event) => setTraceNotes(event.target.value)} />
                  </Field>
                </Stack>
              )}
            </Card>
          </Stack>
        </Screen>
      )}

      {/* Thanh lưu cố định */}
      <Box
        sx={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, bgcolor: '#fff', borderTop: '1px solid #EEF0F2',
          px: 2, pt: 1.5, pb: 'calc(env(safe-area-inset-bottom) + 12px)', zIndex: 20,
        }}
      >
        <Button fullWidth variant="contained" size="large" onClick={submit} disabled={busy || uploading || uploadingTrace}>
          {busy ? <CircularProgress size={22} color="inherit" /> : isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
        </Button>
      </Box>

      {/* Sheet loại mặt hàng — chỉ hiện loại thuộc ngành hàng của quầy */}
      <Sheet open={catOpen} onClose={() => setCatOpen(false)} title="Chọn loại mặt hàng">
        {stall.isLoading || categories.isLoading ? (
          <LoadingScreen height={120} />
        ) : !stallCategory ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            Quầy chưa được gán ngành hàng — liên hệ quản lý chợ để cập nhật.
          </Typography>
        ) : (
          <Stack gap={1.5}>
            <Stack direction="row" gap={1} alignItems="center">
              <TextField
                fullWidth
                label="Thêm loại mặt hàng mới"
                placeholder="VD: Tôm, Cá..."
                value={newCategoryName}
                inputProps={{ maxLength: 100 }}
                disabled={createCategory.isPending}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCategory();
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={createCategory.isPending ? <CircularProgress size={16} color="inherit" /> : <Plus size={17} />}
                disabled={createCategory.isPending || !newCategoryName.trim()}
                onClick={addCategory}
                sx={{ flexShrink: 0, height: 40, py: 0 }}
              >
                Thêm
              </Button>
            </Stack>

            {(categories.data ?? []).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, textAlign: 'center' }}>
                Chưa có loại mặt hàng. Bạn có thể thêm loại mới ở trên.
              </Typography>
            ) : (
              <Stack>
                {(categories.data ?? []).map((c) => (
                  <OptionRow key={c.id} label={c.name} selected={c.id === categoryId} onClick={() => { setCategoryId(c.id); setErrors((x) => ({ ...x, categoryId: undefined })); setCatOpen(false); }} />
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Sheet>

      {/* Sheet đơn vị */}
      <Sheet open={unitOpen} onClose={() => setUnitOpen(false)} title="Chọn đơn vị bán">
        {settings.isLoading ? (
          <LoadingScreen height={120} />
        ) : units.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Chưa có đơn vị được cấu hình</Typography>
        ) : (
          <Stack>
            {units.map((u) => (
              <OptionRow key={u} label={u} selected={u === unit} onClick={() => { setUnit(u); setErrors((x) => ({ ...x, unit: undefined })); setUnitOpen(false); }} />
            ))}
          </Stack>
        )}
      </Sheet>
    </Box>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ display: 'block', mb: 0.75 }}>
        {label}{required && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
      </Typography>
      {children}
      {error && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{error}</Typography>}
    </Box>
  );
}

function PickerButton({ value, placeholder, onClick, error }: { value?: string; placeholder: string; onClick: () => void; error?: boolean }) {
  return (
    <Box
      component="button" type="button" onClick={onClick}
      sx={{
        width: '100%', minHeight: 40, px: 1.5, py: 1, cursor: 'pointer', textAlign: 'left',
        border: '1px solid', borderColor: error ? 'error.main' : '#E0E3E7', borderRadius: '8px', bgcolor: '#fff',
        display: 'flex', alignItems: 'center', gap: 1,
      }}
    >
      <Box component="span" sx={{ flex: 1, minWidth: 0, fontSize: 15, color: value ? 'text.primary' : 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || placeholder}
      </Box>
      <ChevronDown size={18} color="#9CA3AF" />
    </Box>
  );
}

function OptionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <Box
      component="button" type="button" onClick={onClick}
      sx={{
        width: '100%', border: 0, bgcolor: 'transparent', cursor: 'pointer', textAlign: 'left',
        py: 1.5, px: 0.5, fontSize: 15, borderBottom: '1px solid #F1F3F5',
        color: selected ? 'primary.main' : 'text.primary', fontWeight: selected ? 700 : 400,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      {label}
      {selected && <Box component="span" sx={{ color: 'primary.main' }}>✓</Box>}
    </Box>
  );
}
