// Logo sementara. Kalau logo instansi sudah ada, taruh filenya di
// src/assets/ lalu ganti isi komponen ini dengan <img src={logo} ... />.
// Semua halaman memakai komponen ini, jadi cukup diganti di satu tempat.
import { Box } from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

export default function Logo({ size = 36 }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <ShieldOutlinedIcon sx={{ fontSize: size * 0.62 }} />
    </Box>
  );
}