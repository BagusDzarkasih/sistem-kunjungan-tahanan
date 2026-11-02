// Tema tampilan MUI. Warna mengikuti wireframe: aksen #0085df, tombol #0069ae.
// Ganti warna atau font cukup di file ini, semua halaman ikut berubah.
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0069ae', // tombol (teks putih)
      dark: '#00578f',
      light: '#e6f3fc',
      contrastText: '#ffffff',
    },
    info: { main: '#0085df' }, // aksen, ikon, fokus
    divider: '#c9d8e6',
    background: {
      default: '#f2f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0a2a43',
      secondary: '#4f6579',
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