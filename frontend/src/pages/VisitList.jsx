// Halaman petugas: daftar kunjungan (wireframe 5).
// Tab status, pencarian, rentang tanggal, tabel, dan halaman. Memuat ulang otomatis tiap 30 detik.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import StatusChip from '../components/StatusChip';
import { getVisits } from '../services/visit.service';

const LIMIT = 10;

const TABS = [
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
];

// Alamat halaman detail kunjungan (dikerjakan di tahap berikutnya).
const detailPath = (id) => `/staff/visits/${id}`;

// 2026-10-12 -> 12-10-2026
const formatDate = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('-') : '-');

function getErrorMessage(err) {
  if (!err.response) return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  const data = err.response.data;
  return data?.pesan ?? data?.message ?? 'Daftar kunjungan gagal dimuat.';
}

export default function VisitList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('menunggu');
  const [search, setSearch] = useState(''); // isi kolom cari
  const [q, setQ] = useState(''); // kata kunci yang dipakai mencari (setelah jeda)
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0); // naik untuk memuat ulang
  const [waiting, setWaiting] = useState(null);
  const [result, setResult] = useState({ key: '', rows: [], totalPages: 1, error: '' });

  // Mencari 400 ms setelah berhenti mengetik.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Muat ulang otomatis tiap 30 detik, supaya pendaftaran baru muncul sendiri.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Jumlah kunjungan menunggu untuk label tab.
  useEffect(() => {
    const controller = new AbortController();
    getVisits({ status: 'menunggu', page: 1, limit: 1 }, controller.signal)
      .then((r) => {
        if (!controller.signal.aborted) setWaiting(r.total);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [tick]);

  // Daftar kunjungan sesuai tab, pencarian, tanggal, dan halaman.
  const queryKey = [status, q, dari, sampai, page].join('|');
  useEffect(() => {
    const controller = new AbortController();
    getVisits({ status, q, dari, sampai, page, limit: LIMIT }, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setResult({ key: queryKey, rows: r.rows, totalPages: r.totalPages, error: '' });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ key: queryKey, rows: [], totalPages: 1, error: getErrorMessage(err) });
      });
    return () => controller.abort();
  }, [status, q, dari, sampai, page, queryKey, tick]);

  const loading = result.key !== queryKey;
  const hasFilter = Boolean(search || dari || sampai);

  const resetFilter = () => {
    setSearch('');
    setQ('');
    setDari('');
    setSampai('');
    setPage(1);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Daftar kunjungan
      </Typography>

      <Paper variant="outlined">
        <Tabs
          value={status}
          onChange={(_, value) => {
            setStatus(value);
            setPage(1);
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t) => (
            <Tab
              key={t.value}
              value={t.value}
              label={
                t.value === 'menunggu' && waiting !== null ? `${t.label} ${waiting}` : t.label
              }
            />
          ))}
        </Tabs>
        <Divider />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Cari nama atau NIK"
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
          {hasFilter && (
            <Button onClick={resetFilter} size="small">
              Reset
            </Button>
          )}
          <IconButton aria-label="Muat ulang" onClick={() => setTick((t) => t + 1)}>
            <RefreshIcon />
          </IconButton>
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
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Tanggal</TableCell>
                <TableCell>Tahanan</TableCell>
                <TableCell>Pembesuk</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
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
                  <TableCell>{row.tahanan}</TableCell>
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

        <Divider />
        <Stack
          direction="row"
          sx={{ p: 1.5, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>
            Halaman {page} dari {result.totalPages}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <IconButton
              aria-label="Halaman sebelumnya"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              aria-label="Halaman berikutnya"
              disabled={page >= result.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}