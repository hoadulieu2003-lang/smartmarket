import { alpha, createTheme } from '@mui/material/styles';

/** Theme Smart Market Mini App — Smart Green, bo góc lớn, mobile-first (PRD mục 7). */
export const theme = createTheme({
  palette: {
    primary: { main: '#16A34A', dark: '#15803D', light: '#22C55E', contrastText: '#fff' },
    secondary: { main: '#2563EB', dark: '#1D4ED8' },
    success: { main: '#22C55E', dark: '#15803D' },
    warning: { main: '#F59E0B', dark: '#B45309' },
    error: { main: '#EF4444', dark: '#B91C1C' },
    info: { main: '#3B82F6', dark: '#1D4ED8' },
    background: { default: '#F3F4F6', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' },
    divider: '#E5E7EB',
  },
  // SF Pro Display (font hệ thống Apple, không nhúng web được → dùng system stack ưu tiên SF)
  typography: {
    fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', 'Helvetica Neue', Arial, sans-serif`,
    h1: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 },
    h2: { fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 },
    h6: { fontSize: '1.0625rem', fontWeight: 700, lineHeight: 1.35 },
    subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6 },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5 },
    button: { fontSize: '0.9375rem', fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 18 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 14, paddingTop: 10, paddingBottom: 10 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 18, border: '1px solid #EEF0F2', boxShadow: '0 1px 3px rgba(16,24,40,0.05)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ ownerState, theme: t }) => {
          const color = ownerState.color;
          if (ownerState.variant !== 'filled' || !color || color === 'default') {
            return { fontWeight: 600 };
          }
          const palette = t.palette[color as 'primary'];
          return {
            fontWeight: 700,
            backgroundColor: alpha(palette.main, 0.14),
            color: palette.dark,
            border: `1px solid ${alpha(palette.main, 0.28)}`,
            '&::before': {
              content: '""',
              flexShrink: 0,
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: palette.main,
              marginLeft: 6,
              marginRight: -2,
            },
            '&:hover': { backgroundColor: alpha(palette.main, 0.22) },
          };
        },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiBottomNavigationAction: { styleOverrides: { root: { minWidth: 0 } } },
  },
});
