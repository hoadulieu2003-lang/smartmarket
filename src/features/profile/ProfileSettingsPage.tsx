import {
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Camera, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPut, errMsg, uploadImages } from "@/services/api";
import { ensureZaloContact } from "@/services/zalo";
import { Screen, TopBar } from "@/components/ui/bits";
import { toast } from "@/hooks";
import { useAuth } from "@/stores";
import type { MePayload } from "@/types";

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography variant="subtitle2" fontWeight={700}>
      {children}
    </Typography>
  );
}

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bankName, setBankName] = useState(user?.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(
    user?.bankAccountNumber ?? "",
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    user?.bankAccountHolder ?? "",
  );
  const [touched, setTouched] = useState(false);

  const nameError =
    touched && !fullName.trim() ? "Vui lòng nhập họ và tên" : "";

  const updatePhone = useMutation({
    mutationFn: () => ensureZaloContact({ force: true }),
    onSuccess: (nextUser) => {
      setFullName(nextUser.fullName);
      setAvatar(nextUser.avatar ?? "");
      setPhone(nextUser.phone ?? "");
      toast.success("Đã cập nhật thông tin và số điện thoại từ Zalo");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const save = useMutation({
    mutationFn: () =>
      apiPut<MePayload>("/users/me", {
        fullName: fullName.trim(),
        avatar: avatar || undefined,
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
      }),
    onSuccess: (me) => {
      useAuth.getState().setMe(me);
      toast.success("Đã lưu thay đổi");
      navigate(-1);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!fullName.trim()) return;
    save.mutate();
  }

  async function pickAvatar(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const [uploaded] = await uploadImages([file]);
      if (uploaded) setAvatar(uploaded.url);
    } catch (e) {
      toast.error(errMsg(e, "Không thể tải ảnh đại diện lên"));
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <Box>
      <TopBar title="Chỉnh sửa thông tin" onBack />
      <Screen>
        <Stack component="form" onSubmit={submit} gap={3}>
          <Stack gap={2}>
            <SectionLabel>Thông tin cá nhân</SectionLabel>
            <Stack direction="row" alignItems="center" gap={2}>
              <Avatar
                src={avatar || undefined}
                alt={fullName}
                sx={{ width: 72, height: 72, bgcolor: "primary.light", fontSize: 26 }}
              >
                {fullName.trim().charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={uploadingAvatar ? <CircularProgress size={16} /> : <Camera size={16} />}
                  disabled={uploadingAvatar || save.isPending}
                >
                  {uploadingAvatar ? "Đang tải ảnh..." : "Đổi ảnh đại diện"}
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => void pickAvatar(e.target.files)}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  JPG, PNG hoặc WEBP
                </Typography>
              </Box>
            </Stack>
            <TextField
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={!!nameError}
              helperText={nameError || " "}
              size="small"
              fullWidth
              required
            />
            {/* SĐT — xin quyền từ Zalo, không cho sửa tay */}
            <Card sx={{ p: 1.75 }}>
              <Stack direction="row" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    bgcolor: "rgba(22,163,74,0.1)",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Phone size={20} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="caption" color="text.secondary">
                    Số điện thoại
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {phone || "Chưa có — lấy từ Zalo"}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={updatePhone.isPending}
                  onClick={() => updatePhone.mutate()}
                >
                  {updatePhone.isPending
                    ? "..."
                    : phone
                      ? "Cập nhật"
                      : "Lấy số"}
                </Button>
              </Stack>
            </Card>
          </Stack>

          <Stack gap={2}>
            <Box>
              <SectionLabel>Thông tin nhận tiền</SectionLabel>
              <Typography variant="caption" color="text.secondary">
                Tùy chọn — dùng để nhận thanh toán khi bạn bán hàng với vai trò
                tiểu thương.
              </Typography>
            </Box>
            <TextField
              label="Tên ngân hàng"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              size="small"
              fullWidth
              placeholder="VD: Vietcombank"
            />
            <TextField
              label="Số tài khoản"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              size="small"
              fullWidth
              inputProps={{ inputMode: "numeric" }}
            />
            <TextField
              label="Chủ tài khoản"
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value)}
              size="small"
              fullWidth
              placeholder="Tên in trên thẻ / tài khoản"
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={save.isPending || uploadingAvatar}
            startIcon={
              save.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : undefined
            }
          >
            {save.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </Stack>
      </Screen>
    </Box>
  );
}
