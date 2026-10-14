// Halaman login petugas dan admin (wireframe layar 4).
// Memakai Formik untuk mengelola isian dan Yup untuk aturan validasinya.
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import useAuth from '../context/useAuth';
import { getErrorMessage } from '../services/api';

const loginSchema = Yup.object({
  username: Yup.string().trim().required('Username wajib diisi'),
  password: Yup.string().required('Password wajib diisi'),
});

export default function Login() {
  const { user, checking, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const destination = location.state?.from || '/staff/visits';

  const formik = useFormik({
    initialValues: { username: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setErrorMessage('');
      try {
        await login(values.username.trim(), values.password);
        navigate(destination, { replace: true });
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        setSubmitting(false);
      }
    },
  });

  // Sudah login? Tidak perlu melihat halaman login lagi.
  if (!checking && user) {
    return <Navigate to="/staff/visits" replace />;
  }

  const hasError = (name) => formik.touched[name] && Boolean(formik.errors[name]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' },
      }}
    >
      {/* Panel kiri: identitas aplikasi, disembunyikan di layar kecil */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: 'primary.contrastText',
          background: (t) =>
            `linear-gradient(160deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
           <Logo size={60} />
          <Typography variant="h6" component="p">
            Sistem Manajemen Kunjungan Tahanan
          </Typography>
        </Box>
        <Box>
          <Typography variant="h4" component="h2" sx={{ mb: 2, maxWidth: 380 }}>
            Pembesukan tercatat rapi, dari loket ke laporan.
          </Typography>
          <Typography sx={{ opacity: 0.9, maxWidth: 380 }}>
            Cocokkan data pembesuk, setujui atau tolak kunjungan, dan telusuri
            riwayatnya di satu tempat.
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Khusus petugas dan admin.
        </Typography>
      </Box>

      {/* Panel kanan: formulir login */}
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          p: { xs: 2, sm: 4 },
          bgcolor: 'background.default',
        }}
      >
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Logo size={36} />
            <Typography fontWeight={700}>Kunjungan Tahanan</Typography>
          </Box>

          <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
            Masuk petugas
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Gunakan akun yang diberikan admin.
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {errorMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <TextField
              fullWidth
              id="username"
              name="username"
              label="Username"
              autoComplete="username"
              autoFocus
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={hasError('username')}
              helperText={hasError('username') ? formik.errors.username : ' '}
            />
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={hasError('password')}
              helperText={hasError('password') ? formik.errors.password : ' '}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={formik.isSubmitting}
              sx={{ mt: 1, py: 1.25 }}
            >
              {formik.isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Masuk'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}