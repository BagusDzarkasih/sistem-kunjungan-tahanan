// Halaman petugas: daftar kunjungan (wireframe 4).
// Filter status (bisa dibuka dari tautan ?status=menunggu), pencarian, rentang tanggal.
// Desktop: tabel. HP: kartu dengan panel filter yang bisa dilipat.
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import StatusChip from '../components/StatusChip';
import { getVisits } from '../services/visit.service';

const LIMIT = 20;

const STATUS_VALUES = ['menunggu', 'disetujui', 'ditolak', 'kedaluwarsa'];
const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
];

const detailPath = (id) => `/staff/visits/${id}`;

// 2026-10-12 -> 12-10-2026
const formatDate = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('-') : '-');

function getErrorMessage(err) {
  if (!err.response) return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  const data = err.response.data;
  return data?.pesan ?? data?.message ?? 'Daftar kunjungan gagal dimuat.';
}

// Lencana kecil untuk nama tahanan yang baru diketik pembesuk dan belum dicek petugas.
function UnverifiedBadge() {
  return (
    <Chip
      size="small"
      color="warning"
      variant="outlined"
      label="belum diverifikasi"
      sx={{ ml: 1 }}
    />
  );
}

export default function VisitList() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:767px)');
  const [searchParams, setSearchParams] = useSearchParams();

  // Status diambil dari alamat halaman, jadi tautan dari Dashboard langsung terisi.
  const fromUrl = searchParams.get('status');
  const status = STATUS_VALUES.includes(fromUrl) ? fromUrl : '';

  const [search, setSearch] = useState(''); // isi kolom cari
  const [q, setQ] = useState(''); // kata kunci yang dipakai mencari (setelah jeda)
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [pageState, setPageState] = useState({ status, page: 1 });
  const [tick, setTick] = useState(0); // naik untuk memuat ulang
  const [showFilter, setShowFilter] = useState(false); // panel filter di HP
  const [result, setResult] = useState({ key: '', rows: [], total: 0, totalPages: 1, error: '' });

  // Ganti status -> kembali ke halaman 1 (page dianggap 1 kalau statusnya berbeda).
  const page = pageState.status === status ? pageState.page : 1;
  const setPage = (p) => setPageState({ status, page: p });

  // Mencari 400 ms setelah berhenti mengetik.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPageState((s) => ({ ...s, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Muat ulang otomatis tiap 30 detik, supaya pendaftaran baru muncul sendiri.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const queryKey = [status, q, dari, sampai, page].join('|');
  useEffect(() => {
    const controller = new AbortController();
    getVisits({ status, q, dari, sampai, page, limit: LIMIT }, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setResult({
          key: queryKey,
          rows: r.rows,
          total: r.total,
          totalPages: r.totalPages,
          error: '',
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ key: queryKey, rows: [], total: 0, totalPages: 1, error: getErrorMessage(err) });
      });
    return () => controller.abort();
  }, [status, q, dari, sampai, page, queryKey, tick]);

  const loading = result.key !== queryKey;
  const hasFilter = Boolean(search || dari || sampai || status);

  const changeStatus = (value) => {
    setSearchParams(value ? { status: value } : {}, { replace: true });
  };

  const resetFilter = () => {
    setSearch('');
    setQ('');
    setDari('');
    setSampai('');
    setSearchParams({}, { replace: true });
    setPageState({ status: '', page: 1 });
  };

  const from = result.total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, result.total);

  const statusField = (
    <TextField
      select
      size="small"
      label="Status"
      value={status}
      onChange={(e) => changeStatus(e.target.value)}
      sx={{ minWidth: 160 }}
    >
      {STATUS_OPTIONS.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const dateFields = (
    <>
      <TextField
        size="small"
        type="date"
        label="Dari"
        value={dari}
        onChange={(e) => {
          setDari(e.target.value);
          setPage(1);
        }}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        size="small"
        type="date"
        label="Sampai"
        value={sampai}
        onChange={(e) => {
          setSampai(e.target.value);
          setPage(1);
        }}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Kunjungan
      </Typography>

      <Paper variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Cari tahanan, pembesuk, atau NIK"
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

          {isMobile ? (
            <>
              <Button
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilter((v) => !v)}
                variant="outlined"
                sx={{ minHeight: 44 }}
              >
                Filter
              </Button>
              <Collapse in={showFilter}>
                <Stack spacing={2}>
                  {statusField}
                  {dateFields}
                  {hasFilter && <Button onClick={resetFilter}>Reset</Button>}
                </Stack>
              </Collapse>
            </>
          ) : (
            <>
              {statusField}
              {dateFields}
              {hasFilter && (
                <Button onClick={resetFilter} size="small">
                  Reset
                </Button>
              )}
              <IconButton aria-label="Muat ulang" onClick={() => setTick((t) => t + 1)}>
                <RefreshIcon />
              </IconButton>
            </>
          )}
        </Stack>

        {result.error && (
          <Alert
            severity="error"
            sx={{ mx: 2, mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => setTick((t) => t + 1)}>
                Coba lagi
              </Button>
            }
          >
            {result.error}
          </Alert>
        )}

        <Box sx={{ height: 4 }}>{loading && <LinearProgress />}</Box>

        {isMobile ? (
          <Stack divider={<Divider />}>
            {!loading && !result.error && result.rows.length === 0 && (
              <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                Tidak ada kunjungan.
              </Typography>
            )}
            {result.rows.map((row) => (
              <Box key={row.id} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700 }}>{row.noUrut}</Typography>
                  <StatusChip status={row.status} />
                </Box>
                <Typography sx={{ mt: 0.5 }}>
                  {row.tahanan}
                  {row.tahananBelumVerifikasi && <UnverifiedBadge />}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {row.jumlahPembesuk} pembesuk, {formatDate(row.tanggal)}
                  </Typography>
                  <Button size="small" onClick={() => navigate(detailPath(row.id))} sx={{ minHeight: 44 }}>
                    Lihat
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Tahanan</TableCell>
                  <TableCell>Pembesuk</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && !result.error && result.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Tidak ada kunjungan.
                    </TableCell>
                  </TableRow>
                )}
                {result.rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.noUrut}</TableCell>
                    <TableCell>{formatDate(row.tanggal)}</TableCell>
                    <TableCell>
                      {row.tahanan}
                      {row.tahananBelumVerifikasi && <UnverifiedBadge />}
                    </TableCell>
                    <TableCell>{row.jumlahPembesuk} orang</TableCell>
                    <TableCell>
                      <StatusChip status={row.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => navigate(detailPath(row.id))}>
                        Lihat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider />
        <Stack
          direction="row"
          sx={{ p: 1.5, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>
            {result.total > 0
              ? `Menampilkan ${from} sampai ${to} dari ${result.total}`
              : 'Tidak ada data'}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <IconButton
              aria-label="Halaman sebelumnya"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              aria-label="Halaman berikutnya"
              disabled={page >= result.totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}