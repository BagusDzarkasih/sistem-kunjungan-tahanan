import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, textAlign: 'center' }}>
      <Box>
        <Typography variant="h3" component="h1" color="primary.dark" sx={{ mb: 1 }}>
          404
        </Typography>
        <Typography sx={{ mb: 3 }} color="text.secondary">
          Halaman yang Anda cari tidak ditemukan.
        </Typography>
        <Button component={Link} to="/" variant="contained">
          Ke halaman utama
        </Button>
      </Box>
    </Box>
  );
}