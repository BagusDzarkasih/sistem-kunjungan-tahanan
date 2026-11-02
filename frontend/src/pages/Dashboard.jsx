// Halaman pertama setelah login (wireframe 13): ringkasan hari ini dan bulan ini,
// pintasan ke pekerjaan yang menunggu, dan grafik kunjungan disetujui per hari.
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import BarChart from '../components/BarChart';
import { getErrorMessage } from '../services/api';
import { getDashboard } from '../services/dashboard.service';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// "2026-10-29" -> "29 Okt 2026"
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${SHORT_MONTHS[Number(m) - 1]} ${y}`;
}

// "2026-10" -> "Oktober 2026"
function formatMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

// Kartu angka dengan judul kecil dan angka besar.
function StatCard({ label, value, color, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderLeft: 4, borderLeftColor: color ?? 'divider' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h4" component="p" sx={{ my: 0.5 }}>
        {value}
      </Typography>
      {children}
    </Paper>
  );
}

const RANGES = [7, 14, 31];

export default function Dashboard() {
  const [hari, setHari] = useState(14);
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: '', data: null, error: '' });

  const queryKey = `${hari}|${tick}`;

  useEffect(() => {
    const controller = new AbortController();
    getDashboard(hari, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key: queryKey, data, error: '' });
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setResult({ key: queryKey, data: null, error: getErrorMessage(err) });
        }
      });
    return () => controller.abort();
  }, [hari, queryKey]);

  const loading = result.key !== queryKey;
  const { data } = result;

  const chartData = (data?.per_hari ?? []).map((d) => ({
    label: String(Number(d.tanggal.slice(8, 10))),
    value: d.jumlah_kunjungan,
    title: `${formatDate(d.tanggal)}: ${d.jumlah_kunjungan} kunjungan, ${d.jumlah_pembesuk} pembesuk`,
  }));

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Dashboard
        </Typography>
        {data && (
          <Typography sx={{ color: 'text.secondary' }}>{formatDate(data.tanggal)}</Typography>
        )}
      </Box>

      {result.error && !loading && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setTick((t) => t + 1)}>
              Coba lagi
            </Button>
          }
        >
          {result.error}
        </Alert>
      )}

      {/* Kerangka abu selama memuat pertama kali */}
      {!data && loading && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} />
          ))}
        </Box>
      )}

      {data && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <StatCard label="Perlu diproses" value={data.perlu_diproses} color="warning.main">
              <Button
                component={RouterLink}
                to="/staff/visits?status=menunggu"
                size="small"
                sx={{ minHeight: 44 }}
              >
                Buka panel
              </Button>
            </StatCard>
            <StatCard
              label="Tahanan belum diverifikasi"
              value={data.tahanan_belum_diverifikasi}
              color="info.main"
            >
              <Button
                component={RouterLink}
                to="/staff/prisoners?status=belum"
                size="small"
                sx={{ minHeight: 44 }}
              >
                Lihat daftar
              </Button>
            </StatCard>
          </Box>

          <Typography variant="h6" component="h2">
            Hari ini
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            }}
          >
            <StatCard label="Menunggu" value={data.hari_ini.menunggu} color="warning.main" />
            <StatCard label="Disetujui" value={data.hari_ini.disetujui} color="success.main" />
            <StatCard label="Ditolak" value={data.hari_ini.ditolak} color="error.main" />
            <StatCard label="Kedaluwarsa" value={data.hari_ini.kedaluwarsa} />
          </Box>

          <Typography variant="h6" component="h2">
            Bulan ini ({formatMonth(data.bulan_ini.bulan)})
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <StatCard label="Total kunjungan" value={data.bulan_ini.total_kunjungan} color="info.main" />
            <StatCard label="Total pembesuk" value={data.bulan_ini.total_pembesuk} color="info.main" />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Disetujui {data.bulan_ini.disetujui}, ditolak {data.bulan_ini.ditolak}, menunggu{' '}
            {data.bulan_ini.menunggu}, kedaluwarsa {data.bulan_ini.kedaluwarsa}
          </Typography>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
                mb: 1,
              }}
            >
              <Typography variant="h6" component="h2">
                Kunjungan disetujui per hari
              </Typography>
              <TextField
                select
                size="small"
                label="Rentang"
                value={hari}
                onChange={(e) => setHari(Number(e.target.value))}
                sx={{ minWidth: 130 }}
              >
                {RANGES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r} hari
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ opacity: loading ? 0.5 : 1 }}>
              <BarChart
                data={chartData}
                ariaLabel={`Grafik batang jumlah kunjungan disetujui per hari selama ${hari} hari terakhir`}
              />
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}