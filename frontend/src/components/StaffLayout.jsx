// Kerangka halaman petugas: bilah atas dengan menu (sesuai wireframe),
// nama pengguna, dan tombol keluar. Isi halaman tampil di <Outlet />.
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../context/useAuth';
import Logo from './Logo';

const MENU = [
  { label: 'Kunjungan', to: '/staff/visits' },
  { label: 'Tahanan', to: '/staff/prisoners' },
  { label: 'Pembesuk', to: '/staff/visitors' },
  { label: 'Laporan', to: '/staff/reports' },
  { label: 'Admin', to: '/staff/admin', adminOnly: true },
];

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleMenu = MENU.filter(
    (item) => !item.adminOnly || user.role === 'admin'
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
            <Logo size={32} />
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Kunjungan Tahanan
            </Typography>
          </Box>

          <Box
            component="nav"
            aria-label="Menu utama"
            sx={{ display: 'flex', gap: 0.5, flexGrow: 1, overflowX: 'auto' }}
          >
            {visibleMenu.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                color="inherit"
                sx={{
                  color: 'text.secondary',
                  px: 1.75,
                  '&.active': {
                    color: 'primary.dark',
                    bgcolor: 'primary.light',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" noWrap>
              {user.nama}
            </Typography>
            <Chip
              size="small"
              label={user.role === 'admin' ? 'Admin' : 'Petugas'}
              color="primary"
              variant="outlined"
            />
            <Tooltip title="Keluar">
              <IconButton onClick={handleLogout} aria-label="Keluar" size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}