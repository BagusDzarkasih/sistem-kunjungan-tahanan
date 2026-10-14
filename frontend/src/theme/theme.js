// Tema tampilan MUI. Warna utama instansi: #0085de.
// Ganti warna atau font cukup di file ini, semua halaman ikut berubah.
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0085de',
      dark: '#0067ad',
      light: '#e6f3fc',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#16212c',
      secondary: '#5b6b7a',
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
    },
  },
});

export default theme;