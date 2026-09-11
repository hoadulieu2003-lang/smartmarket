import { Alert, Snackbar } from '@mui/material';
import { create } from 'zustand';

type Severity = 'success' | 'error' | 'info' | 'warning';
interface ToastState {
  open: boolean;
  message: string;
  severity: Severity;
  show: (message: string, severity?: Severity) => void;
  close: () => void;
}

export const useToast = create<ToastState>((set) => ({
  open: false,
  message: '',
  severity: 'success',
  show: (message, severity = 'success') => set({ open: true, message, severity }),
  close: () => set({ open: false }),
}));

export const toast = {
  success: (m: string) => useToast.getState().show(m, 'success'),
  error: (m: string) => useToast.getState().show(m, 'error'),
  info: (m: string) => useToast.getState().show(m, 'info'),
};

export function Toaster() {
  const { open, message, severity, close } = useToast();
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={close}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: 'calc(var(--app-safe-area-top) + 64px)' }}
    >
      <Alert
        onClose={close}
        severity={severity}
        variant="filled"
        sx={{
          borderRadius: 3, minWidth: 240,
          boxShadow: '0 8px 24px rgba(16,24,40,0.18)',
          ...(severity === 'success' && {
            bgcolor: 'primary.main', color: '#fff',
            '& .MuiAlert-icon': { color: '#fff' },
            '& .MuiAlert-action': { color: '#fff' },
          }),
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
