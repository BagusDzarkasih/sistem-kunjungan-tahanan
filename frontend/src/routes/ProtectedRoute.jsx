// Penjaga halaman petugas/admin.
//  - belum login            -> diarahkan ke /login
//  - role tidak sesuai      -> diarahkan ke halaman utama petugas
// Pemakaian: <ProtectedRoute allowedRoles={['admin']}> ... </ProtectedRoute>
import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../context/useAuth';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    // "from" menyimpan alamat tujuan supaya setelah login kembali ke sana
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/staff/visits" replace />;
  }

  return <Outlet />;
}