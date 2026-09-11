import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { theme } from '@/app/theme';
import { Toaster, toast } from '@/components/ui/toast';
import { errCode, errMsg } from '@/services/api';
import { applyQueryDefaults, GC_TIME } from '@/config/query';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Bỏ qua lỗi auth (đã tự refresh/logout) — chỉ toast lỗi tải dữ liệu thực sự.
      const code = errCode(error);
      if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_INVALID') return;
      toast.error(errMsg(error, 'Không tải được dữ liệu'));
    },
  }),
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000, gcTime: GC_TIME },
  },
});

// staleTime theo tầng (config/static/semi) đặt tập trung theo tiền tố queryKey.
applyQueryDefaults(queryClient);

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
