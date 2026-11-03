// Halaman petugas: daftar pembesuk (wireframe 8).
// Cari nama atau NIK, tambah, ubah, hapus. Desktop: tabel. HP: kartu dengan menu titik tiga.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  LinearProgress,
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
import RowMenu from '../components/RowMenu';
import VisitorFormDialog from '../components/VisitorFormDialog';
import useDebounced from '../hooks/useDebounced';
import usePagedList from '../hooks/usePagedList';
import { getErrorMessage } from '../services/api';
import { deleteVisitor, getVisitors } from '../services/visitor.service';
import { formatDate } from '../utils/format';

const LIMIT = 20;

function KtpChip({ has }) {
  return has ? (
    <Chip size="small" color="success" variant="outlined" label="Ada" />
  ) : (
    <Chip size="small" variant="outlined" label="Belum" />
  );
}

export default function Visitors() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:767px)');

  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());

  // Kalau pencarian berubah, halaman kembali ke 1.
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const page = pageState.key === q ? pageState.page : 1;
  const setPage = (p) => setPageState({ key: q, page: p });

  const { rows, total, error, loading, reload } = usePagedList(getVisitors, { q, page, limit: LIMIT });

  const [formTarget, setFormTarget] = useState(undefined); // undefined = tutup, null = tambah
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [toast, setToast] = useState('');

  const handleDelete = async () => {
    setBusy(true);
    setDialogError('');
    try {
      await deleteVisitor(deleteTarget.id);
      setToast(`${deleteTarget.nama} dihapus`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDialogError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const actions = (row) => [
    { label: 'Lihat', onClick: () => navigate(`/staff/visitors/${row.id}`) },
    { label: 'Ubah', onClick: () => setFormTarget(row) },
    { label: 'Hapus', color: 'error.main', onClick: () => setDeleteTarget(row) },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
        <Typography variant="h5" component="h1">
          Pembesuk
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormTarget(null)} sx={{ minHeight: 44 }}>
          Tambah pembesuk
        </Button>
      </Box>

      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Cari nama atau NIK"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        </Box>

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
                Tidak ada pembesuk.
              </Typography>
            )}
            {rows.map((row) => (
              <Box key={row.id} sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>{row.nama}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                  NIK {row.nik}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {row.no_hp} · KTP: {row.punya_foto_ktp ? 'ada' : 'belum'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button size="small" sx={{ minHeight: 44 }} onClick={() => navigate(`/staff/visitors/${row.id}`)}>
                      Lihat
                    </Button>
                    <RowMenu items={actions(row).slice(1)} />
                  </Box>
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
                  <TableCell>NIK</TableCell>
                  <TableCell>No HP</TableCell>
                  <TableCell>Foto KTP</TableCell>
                  <TableCell>Terdaftar</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && !error && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Tidak ada pembesuk.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.nama}</TableCell>
                    <TableCell>{row.nik}</TableCell>
                    <TableCell>{row.no_hp}</TableCell>
                    <TableCell>
                      <KtpChip has={row.punya_foto_ktp} />
                    </TableCell>
                    <TableCell>{formatDate(row.dibuat_pada)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {actions(row).map((a) => (
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

      <VisitorFormDialog
        open={formTarget !== undefined}
        visitor={formTarget ?? null}
        onClose={() => setFormTarget(undefined)}
        onSaved={(saved) => {
          setFormTarget(undefined);
          setToast(`${saved.nama} disimpan`);
          reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus pembesuk?"
        message={
          <>
            Data <strong>{deleteTarget?.nama}</strong> akan dihapus. Pembesuk yang sudah punya kunjungan
            tidak bisa dihapus.
          </>
        }
        confirmLabel="Hapus"
        color="error"
        loading={busy}
        error={dialogError}
        onConfirm={handleDelete}
        onClose={() => {
          if (busy) return;
          setDeleteTarget(null);
          setDialogError('');
        }}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}