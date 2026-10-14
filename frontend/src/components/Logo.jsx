// Logo instansi. Semua halaman memakai komponen ini, jadi logo cukup
// diganti di satu tempat. File gambarnya ada di src/assets/LogoBNN.png.
import { Box } from '@mui/material';
import logoBNN from '../assets/LogoBNN.png';

export default function Logo({ size = 50 }) {
  return (
    <Box
      component="img"
      src={logoBNN}
      alt="Logo BNN"
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}