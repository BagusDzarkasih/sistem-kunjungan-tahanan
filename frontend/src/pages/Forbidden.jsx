// Halaman penolakan (403): pengguna sudah login tetapi perannya tidak boleh membuka halaman ini.
import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" color="primary.dark" sx={{ mb: 1 }}>
        403
      </Typography>
      <Typography sx={{ mb: 3 }} color="text.secondary">
        Anda tidak memiliki akses ke halaman ini.
      </Typography>
      <Button component={Link} to="/staff/dashboard" variant="contained">
        Ke Dashboard
      </Button>
    </Box>
  );
}