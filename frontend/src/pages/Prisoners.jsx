// Halaman petugas: daftar tahanan (wireframe 6).
// Cari nama, filter verifikasi (bisa dibuka dari tautan ?status=belum), tambah, ubah,
// verifikasi, gabung, hapus. Desktop: tabel. HP: kartu dengan menu titik tiga.
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
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
import MergeDialog from '../components/MergeDialog';
import PrisonerFormDialog from '../components/PrisonerFormDialog';
import RowMenu from '../components/RowMenu';
import VerifyChip from '../components/VerifyChip';
import useDebounced from '../hooks/useDebounced';
import usePagedList from '../hooks/usePagedList';
import { getErrorMessage } from '../services/api';
import {
  deletePrisoner,
  getPrisoners,
  verifyPrisoner,
} from '../services/prisoner.service';
import { getErrorCode } from '../utils/errors';
import { formatDate } from '../utils/format';

const LIMIT = 20;
const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'belum', label: 'Belum diverifikasi' },
  { value: 'terverifikasi', label: 'Terverifikasi' },
];

export default function Prisoners() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:767px)');
  const [searchParams, setSearchParams] = useSearchParams();

  const fromUrl = searchParams.get('status');
  const status = ['belum', 'terverifikasi'].includes(fromUrl) ? fromUrl : '';

  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());

  // Kalau q atau status berubah, halaman kembali ke 1.
  const filterKey = `${q}|${status}`;
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p) => setPageState({ key: filterKey, page: p });

  const { rows, total, error, loading, reload } = usePagedList(getPrisoners, {
    q,
    status,
    page,
    limit: LIMIT,
  });

  const [formTarget, setFormTarget] = useState(undefined); // undefined = tutup, null = tambah
  const [mergeSource, setMergeSource] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [toast, setToast] = useState('');

  const closeConfirm = () => {
    if (busy) return;
    setVerifyTarget(null);
    setDeleteTarget(null);
    setDialogError('');
  };

  const handleVerify = async () => {
    setBusy(true);
    setDialogError('');
    try {
      await verifyPrisoner(verifyTarget.id);
      setToast(`${verifyTarget.nama} sudah diverifikasi`);
      setVerifyTarget(null);
      reload();
    } catch (err) {
      setDialogError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setDialogError('');
    try {
      await deletePrisoner(deleteTarget.id);
      setToast(`${deleteTarget.nama} dihapus`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDialogError(
        getErrorCode(err) === 'MASIH_DIPAKAI'
          ? `${getErrorMessage(err)}. Kalau ini data ganda, gunakan menu Gabung.`
          : getErrorMessage(err)
      );
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (value) => setSearchParams(value ? { status: value } : {}, { replace: true });

  const actions = (row) => [
    { label: 'Lihat', onClick: () => navigate(`/staff/prisoners/${row.id}`) },
    { label: 'Ubah', onClick: () => setFormTarget(row) },
    {
      label: 'Verifikasi',
      hidden: row.status_verifikasi === 'terverifikasi',
      onClick: () => setVerifyTarget(row),
    },
    { label: 'Gabung', onClick: () => setMergeSource(row) },
    { label: 'Hapus', color: 'error.main', onClick: () => setDeleteTarget(row) },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
        <Typography variant="h5" component="h1">
          Tahanan
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormTarget(null)}
          sx={{ minHeight: 44 }}
        >
          Tambah tahanan
        </Button>
      </Box>

      <Paper variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Cari nama"
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
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {STATUS_OPTIONS.map((o) => (
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
                Tidak ada tahanan.
              </Typography>
            )}
            {rows.map((row) => (
              <Box key={row.id} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700 }}>{row.nama}</Typography>
                  <VerifyChip status={row.status_verifikasi} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Dibuat {formatDate(row.dibuat_pada)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button size="small" sx={{ minHeight: 44 }} onClick={() => navigate(`/staff/prisoners/${row.id}`)}>
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
                  <TableCell>Verifikasi</TableCell>
                  <TableCell>Dibuat</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && !error && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Tidak ada tahanan.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.nama}</TableCell>
                    <TableCell>
                      <VerifyChip status={row.status_verifikasi} />
                    </TableCell>
                    <TableCell>{formatDate(row.dibuat_pada)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {actions(row)
                        .filter((a) => !a.hidden)
                        .map((a) => (
                          <Button
                            key={a.label}
                            size="small"
                            color={a.color ? 'error' : 'primary'}
                            onClick={a.onClick}
                          >
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

      <PrisonerFormDialog
        open={formTarget !== undefined}
        prisoner={formTarget ?? null}
        onClose={() => setFormTarget(undefined)}
        onSaved={(saved) => {
          setFormTarget(undefined);
          setToast(`${saved.nama} disimpan`);
          reload();
        }}
      />

      <MergeDialog
        open={Boolean(mergeSource)}
        source={mergeSource}
        onClose={() => setMergeSource(null)}
        onMerged={(result) => {
          setMergeSource(null);
          setToast(`Digabung ke ${result.tahanan.nama}, ${result.kunjungan_dipindah} kunjungan dipindah`);
          reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(verifyTarget)}
        title="Verifikasi tahanan?"
        message={
          <>
            Tandai <strong>{verifyTarget?.nama}</strong> sebagai terverifikasi (nama sudah dicocokkan
            dengan data resmi).
          </>
        }
        confirmLabel="Verifikasi"
        color="success"
        loading={busy}
        error={dialogError}
        onConfirm={handleVerify}
        onClose={closeConfirm}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus tahanan?"
        message={
          <>
            Data <strong>{deleteTarget?.nama}</strong> akan dihapus. Tahanan yang sudah punya
            kunjungan tidak bisa dihapus.
          </>
        }
        confirmLabel="Hapus"
        color="error"
        loading={busy}
        error={dialogError}
        onConfirm={handleDelete}
        onClose={closeConfirm}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Box>
  );
}
