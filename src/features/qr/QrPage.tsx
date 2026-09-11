import { Box, Stack, Typography } from '@mui/material';
import { ScanLine } from 'lucide-react';
import { FixedHeader } from '@/components/ui/bits';

export function QrPage() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <FixedHeader sx={{ bgcolor: 'primary.main', color: '#fff', pt: 'calc(var(--app-safe-area-top) + 20px)', pb: 3, px: 2, textAlign: 'center' }}>
        <Typography variant="h5">Thanh toán QR</Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>Quét mã để thanh toán hoặc xem sạp</Typography>
      </FixedHeader>
      <Stack flex={1} alignItems="center" justifyContent="center" gap={2} px={4} textAlign="center">
        <Box sx={{ width: 120, height: 120, borderRadius: 6, bgcolor: 'rgba(22,163,74,0.08)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ScanLine size={56} strokeWidth={1.5} />
        </Box>
        <Typography variant="subtitle1">Tính năng đang phát triển</Typography>
        <Typography variant="body2" color="text.secondary">
          Quét mã QR để thanh toán tại sạp và truy cập nhanh gian hàng sẽ sớm có mặt trong bản cập nhật tới.
        </Typography>
      </Stack>
    </Box>
  );
}
