// Halaman admin: Pengguna (wireframe 12).
// Cari, filter role dan status, tambah, ubah, aktif/nonaktif, reset password.
// Desktop: tabel. HP: kartu dengan menu titik tiga.
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ConfirmDialog from '../components/ConfirmDialog';
import ListPagination from '../components/ListPagination';
import ResetPasswordDialog from '../components/ResetPasswordDialog';
import RowMenu from '../components/RowMenu';
import UserFormDialog from '../components/UserFormDialog';
import useAuth from '../context/useAuth';
import useDebounced from '../hooks/useDebounced';
import usePagedList from '../hooks/usePagedList';
import { getErrorMessage } from '../services/api';
import { getUsers, setUserActive } from '../services/user.service';
import { formatDate } from '../utils/format';

const LIMIT = 20;
const ROLE_OPTIONS = [
  { value: '', label: 'Semua role' },
  { value: 'admin', label: 'Admin' },
  { value: 'petugas', label: 'Petugas' },
];
const ACTIVE_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

function ActiveChip({ active }) {
  return active ? (
    <Chip size="small" color="success" label="Aktif" />
  ) : (
    <Chip size="small" variant="outlined" label="Nonaktif" />
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const isMobile = useMediaQuery('(max-width:767px)');

  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const [role, setRole] = useState('');
  const [aktif, setAktif] = useState('');

  // Kalau filter berubah, halaman kembali ke 1.
  const filterKey = `${q}|${role}|${aktif}`;
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p) => setPageState({ key: filterKey, page: p });

  const { rows, total, error, loading, reload } = usePagedList(getUsers, {
    q,
    role,
    aktif,
    page,
    limit: LIMIT,
  });

  const [formTarget, setFormTarget] = useState(undefined); // undefined = tutup, null = tambah
  const [resetTarget, setResetTarget] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [toast, setToast] = useState('');

  const handleToggle = async () => {
    setBusy(true);
    setDialogError('');
    try {
      await setUserActive(activeTarget.id, !activeTarget.aktif);
      setToast(`${activeTarget.nama} ${activeTarget.aktif ? 'dinonaktifkan' : 'diaktifkan'}`);
      setActiveTarget(null);
      reload();
    } catch (err) {
      setDialogError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const actions = (row) => [
    { label: 'Ubah', onClick: () => setFormTarget(row) },
    { label: 'Reset password', onClick: () => setResetTarget(row) },
    {
      label: row.aktif ? 'Nonaktifkan' : 'Aktifkan',
      color: row.aktif ? 'error.main' : undefined,
      hidden: row.id === me?.id, // admin tidak bisa menonaktifkan akun sendiri
      onClick: () => setActiveTarget(row),
    },
  ];

  const roleLabel = (r) => (r === 'admin' ? 'Admin' : 'Petugas');

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
        <Typography variant="h5" component="h1">
          Pengguna
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormTarget(null)} sx={{ minHeight: 44 }}>
          Tambah pengguna
        </Button>
      </Box>

      <Paper variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Cari nama atau username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField select size="small" label="Role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 160 }}>
            {ROLE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Status" value={aktif} onChange={(e) => setAktif(e.target.value)} sx={{ minWidth: 160 }}>
            {ACTIVE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mx: 2, mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={reload}>
                Coba lagi
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Box sx={{ height: 4 }}>{loading && <LinearProgress />}</Box>

        {isMobile ? (
          <Stack divider={<Divider />}>
            {!loading && !error && rows.length === 0 && (
              <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                Tidak ada pengguna.
              </Typography>
            )}
            {rows.map((row) => (
              <Box key={row.id} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, minWidth: 0, wordBreak: 'break-word' }}>{row.nama}</Typography>
                  <ActiveChip active={row.aktif} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 0, wordBreak: 'break-all' }}>
                    {row.username} · {roleLabel(row.role)}
                  </Typography>
                  <RowMenu items={actions(row)} />
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Dibuat</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && !error && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Tidak ada pengguna.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      {row.nama}
                      {row.id === me?.id && ' (Anda)'}
                    </TableCell>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{roleLabel(row.role)}</TableCell>
                    <TableCell>
                      <ActiveChip active={row.aktif} />
                    </TableCell>
                    <TableCell>{formatDate(row.dibuat_pada)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {actions(row)
                        .filter((a) => !a.hidden)
                        .map((a) => (
                          <Button key={a.label} size="small" color={a.color ? 'error' : 'primary'} onClick={a.onClick}>
                            {a.label}
                          </Button>
                        ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider />
        <ListPagination page={page} limit={LIMIT} total={total} loading={loading} onChange={setPage} />
      </Paper>

      <UserFormDialog
        open={formTarget !== undefined}
        user={formTarget ?? null}
        isSelf={formTarget?.id === me?.id}
        onClose={() => setFormTarget(undefined)}
        onSaved={(saved) => {
          setFormTarget(undefined);
          setToast(`${saved.nama} disimpan`);
          reload();
        }}
      />

      <ResetPasswordDialog
        open={Boolean(resetTarget)}
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onDone={() => {
          setResetTarget(null);
          setToast('Password berhasil diubah');
        }}
      />

      <ConfirmDialog
        open={Boolean(activeTarget)}
        title={activeTarget?.aktif ? 'Nonaktifkan pengguna?' : 'Aktifkan pengguna?'}
        message={
          activeTarget?.aktif ? (
            <>
              <strong>{activeTarget?.nama}</strong> tidak akan bisa login sampai diaktifkan kembali.
            </>
          ) : (
            <>
              <strong>{activeTarget?.nama}</strong> akan bisa login kembali.
            </>
          )
        }
        confirmLabel={activeTarget?.aktif ? 'Nonaktifkan' : 'Aktifkan'}
        color={activeTarget?.aktif ? 'error' : 'success'}
        loading={busy}
        error={dialogError}
        onConfirm={handleToggle}
        onClose={() => {
          if (busy) return;
          setActiveTarget(null);
          setDialogError('');
        }}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}