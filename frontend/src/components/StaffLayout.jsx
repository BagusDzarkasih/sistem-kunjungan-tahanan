// Kerangka halaman petugas dan admin (sesuai wireframe):
//  - Desktop (1024 px ke atas): menu samping tetap.
//  - Lebih kecil: menu menjadi laci yang dibuka dari tombol ☰.
// Menu bertanda "adminOnly" hanya tampil untuk admin. Isi halaman tampil di <Outlet />.
import { useState } from 'react';
import {
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import VisitIcon from '@mui/icons-material/AssignmentOutlined';
import PrisonerIcon from '@mui/icons-material/LockOutlined';
import VisitorIcon from '@mui/icons-material/PeopleOutlined';
import ReportIcon from '@mui/icons-material/BarChartOutlined';
import RulesIcon from '@mui/icons-material/GavelOutlined';
import UsersIcon from '@mui/icons-material/ManageAccountsOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../context/useAuth';
import Logo from './Logo';

const DRAWER_WIDTH = 240;

const MENU = [
  { label: 'Dashboard', to: '/staff/dashboard', icon: <DashboardIcon /> },
  { label: 'Kunjungan', to: '/staff/visits', icon: <VisitIcon /> },
  { label: 'Tahanan', to: '/staff/prisoners', icon: <PrisonerIcon /> },
  { label: 'Pembesuk', to: '/staff/visitors', icon: <VisitorIcon /> },
  { label: 'Laporan', to: '/staff/reports', icon: <ReportIcon /> },
  { label: 'Peraturan', to: '/staff/rules', icon: <RulesIcon /> },
  { label: 'Pengguna', to: '/staff/users', icon: <UsersIcon />, adminOnly: true },
  { label: 'Pengaturan', to: '/staff/settings', icon: <SettingsIcon />, adminOnly: true },
];

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width:1024px)');
  const [open, setOpen] = useState(false);

  const visibleMenu = MENU.filter((item) => !item.adminOnly || user.role === 'admin');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menu = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 2 }}>
        <Logo size={36} />
        <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>Kunjungan Tahanan</Typography>
      </Box>
      <Divider />
      <List component="nav" aria-label="Menu utama" sx={{ p: 1 }}>
        {visibleMenu.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: 2,
              minHeight: 44, // target sentuh minimal 44 px
              mb: 0.5,
              color: 'text.primary',
              '& .MuiListItemIcon-root': { color: 'info.main', minWidth: 40 },
              '&.active': {
                bgcolor: 'primary.light',
                color: 'primary.dark',
                fontWeight: 700,
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 'inherit' } } }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {menu}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {menu}
        </Drawer>
      )}

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {!isDesktop && (
              <IconButton edge="start" aria-label="Buka menu" onClick={() => setOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 110, sm: 220 } }}>
              {user.nama}
            </Typography>
            <Chip
              size="small"
              label={user.role === 'admin' ? 'Admin' : 'Petugas'}
              color="primary"
              variant="outlined"
            />
            <Tooltip title="Keluar">
              <IconButton onClick={handleLogout} aria-label="Keluar">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}