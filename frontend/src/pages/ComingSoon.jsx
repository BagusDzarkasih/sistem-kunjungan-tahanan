// Penanda sementara untuk halaman yang belum dikerjakan.
// Setiap halaman nyata nanti menggantikan pemakaian komponen ini di App.jsx.
import { Paper, Typography } from '@mui/material';

export default function ComingSoon({ title, description }) {
  return (
    <>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {description || 'Halaman ini akan dikerjakan pada tahap berikutnya.'}
        </Typography>
      </Paper>
    </>
  );
}