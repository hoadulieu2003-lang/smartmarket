import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import logo from '@/assets/SmartMarket_Logo_v2.svg';
import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { errMsg } from '@/services/api';
import { DEV_ACCOUNTS, zaloLogin } from '@/services/zalo';
import { useRefreshMe } from '@/hooks';
import { useAuth } from '@/stores';

function Splash({ error, onRetry, onDevPick }: { error?: string; onRetry?: () => void; onDevPick?: (t: string) => void }) {
  const isDev = import.meta.env.DEV;
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, px: 4, textAlign: 'center' }}>
      <Box component="img" src={logo} alt="Smart Market" sx={{ width: 260, maxWidth: '82%' }} />
      {!error ? (
        <CircularProgress size={26} sx={{ mt: 2 }} />
      ) : (
        <Stack gap={1.5} mt={1} width="100%" maxWidth={320}>
          <Typography variant="body2" color="error">{error}</Typography>
          {onRetry && <Button variant="contained" onClick={onRetry}>Thử lại</Button>}
          {isDev && onDevPick && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Tài khoản dev (chỉ hiện khi chạy local)</Typography>
              <Stack gap={1}>
                {DEV_ACCOUNTS.map((a) => (
                  <Button key={a.token} size="small" variant="outlined" onClick={() => onDevPick(a.token)}>{a.label}</Button>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}

/** Cổng khởi tạo: đảm bảo có phiên đăng nhập Zalo trước khi vào app (PRD 9, 12.1). */
export function AppGate() {
  const token = useAuth((s) => s.accessToken);
  const setAuth = useAuth((s) => s.setAuth);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(token ? 'ready' : 'loading');
  const [error, setError] = useState('');
  const tried = useRef(false);
  useRefreshMe(); // nếu đã có token → đồng bộ /auth/me

  async function login(overrideToken?: string) {
    setStatus('loading');
    setError('');
    try {
      const data = await zaloLogin(overrideToken);
      setAuth(data);
      setStatus('ready');
    } catch (e) {
      setError(errMsg(e, 'Không thể đăng nhập Zalo'));
      setStatus('error');
    }
  }

  useEffect(() => {
    if (token || tried.current) return;
    tried.current = true;
    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return <Splash error={status === 'error' ? error : undefined} onRetry={() => login()} onDevPick={(t) => login(t)} />;
  }
  return <Outlet />;
}
