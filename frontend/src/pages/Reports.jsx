// Halaman petugas: laporan kunjungan bulanan (wireframe 10).
// Pilih bulan, lihat ringkasan, grafik per hari, per tahanan, rincian, dan unduh PDF atau Excel.
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
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
import DownloadIcon from '@mui/icons-material/Download';
import BarChart from '../components/BarChart';
import { getErrorMessage } from '../services/api';
import { downloadReport, getMonthlyReport } from '../services/report.service';
import { formatDate } from '../utils/format';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const VALID_MONTH = /^20\d{2}-(0[1-9]|1[0-2])$/;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthName(bulan) {
  const [y, m] = bulan.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

function SummaryCard({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function EmptyText({ children }) {
  return (
    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>{children}</Typography>
  );
}

export default function Reports() {
  const isMobile = useMediaQuery('(max-width:767px)');
  const [bulan, setBulan] = useState(currentMonth);
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: '', report: null, error: '' });
  const [downloading, setDownloading] = useState('');
  const [downloadError, setDownloadError] = useState('');

  const valid = VALID_MONTH.test(bulan);
  const queryKey = `${bulan}|${tick}`;

  useEffect(() => {
    if (!VALID_MONTH.test(bulan)) return undefined;
    const controller = new AbortController();
    getMonthlyReport(bulan, controller.signal)
      .then((report) => {
        if (!controller.signal.aborted) setResult({ key: queryKey, report, error: '' });
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setResult({ key: queryKey, report: null, error: getErrorMessage(err) });
        }
      });
    return () => controller.abort();
  }, [bulan, queryKey]);

  const loading = valid && result.key !== queryKey;
  const report = valid && result.key === queryKey ? result.report : null;
  const error = valid && result.key === queryKey ? result.error : '';

  const handleDownload = async (format) => {
    setDownloading(format);
    setDownloadError('');
    try {
      await downloadReport(bulan, format);
    } catch (err) {
      // Respons error berupa blob, jadi pesan server tidak terbaca. Pakai pesan umum.
      setDownloadError(
        err.response ? 'Gagal mengunduh laporan. Coba lagi.' : getErrorMessage(err)
      );
    } finally {
      setDownloading('');
    }
  };

  const chartData = (report?.per_hari ?? []).map((h) => ({
    label: String(Number(h.tanggal.slice(8))),
    value: Number(h.jumlah_kunjungan),
    title: `${formatDate(h.tanggal)}: ${h.jumlah_kunjungan} kunjungan, ${h.jumlah_pembesuk} pembesuk`,
  }));

  const s = report?.ringkasan;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Laporan bulanan
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
          <TextField
            type="month"
            size="small"
            label="Bulan"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            error={!valid}
            helperText={valid ? ' ' : 'Pilih bulan dan tahun yang valid'}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 200 }}
          />
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1.5} sx={{ pb: { md: 2.75 } }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              disabled={!valid || Boolean(downloading)}
              onClick={() => handleDownload('pdf')}
              sx={{ minHeight: 44, flex: { xs: 1, md: 'none' } }}
            >
              {downloading === 'pdf' ? 'Mengunduh...' : 'Unduh PDF'}
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              disabled={!valid || Boolean(downloading)}
              onClick={() => handleDownload('xlsx')}
              sx={{ minHeight: 44, flex: { xs: 1, md: 'none' } }}
            >
              {downloading === 'xlsx' ? 'Mengunduh...' : 'Unduh Excel'}
            </Button>
          </Stack>
        </Stack>
        {downloadError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {downloadError}
          </Alert>
        )}
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setTick((t) => t + 1)}>
              Coba lagi
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {report && (
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            {monthName(report.periode.bulan)}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <SummaryCard label="Total kunjungan" value={s.total_kunjungan} />
            <SummaryCard label="Total pembesuk" value={s.total_pembesuk} />
            <SummaryCard label="Ditolak" value={s.ditolak} />
            <SummaryCard label="Menunggu / kedaluwarsa" value={`${s.menunggu} / ${s.kedaluwarsa}`} />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Total kunjungan, grafik, dan tabel hanya menghitung kunjungan berstatus disetujui.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Kunjungan per hari
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <BarChart
                data={chartData}
                ariaLabel={`Grafik batang jumlah kunjungan disetujui per hari pada ${monthName(report.periode.bulan)}`}
              />
            </Box>
          </Paper>

          <Paper variant="outlined">
            <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 2, pb: 1 }}>
              Per tahanan
            </Typography>
            {report.per_tahanan.length === 0 ? (
              <EmptyText>Belum ada kunjungan disetujui pada bulan ini.</EmptyText>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tahanan</TableCell>
                      <TableCell align="right">Kunjungan</TableCell>
                      <TableCell align="right">Pembesuk</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.per_tahanan.map((t) => (
                      <TableRow key={t.tahanan_id}>
                        <TableCell>{t.tahanan_nama}</TableCell>
                        <TableCell align="right">{t.jumlah_kunjungan}</TableCell>
                        <TableCell align="right">{t.jumlah_pembesuk}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Paper variant="outlined">
            <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 2, pb: 1 }}>
              Rincian kunjungan
            </Typography>
            {report.rincian.length === 0 ? (
              <EmptyText>Belum ada kunjungan disetujui pada bulan ini.</EmptyText>
            ) : isMobile ? (
              <Stack divider={<Divider />}>
                {report.rincian.map((r, i) => (
                  <Box key={`${r.tanggal}-${r.no_urut}-${i}`} sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {formatDate(r.tanggal)} · No {String(r.no_urut).padStart(4, '0')}
                    </Typography>
                    <Typography variant="body2">{r.tahanan_nama}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {r.pembesuk.map((p) => `${p.nama} (${p.hubungan})`).join('; ')}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tanggal</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>Tahanan</TableCell>
                      <TableCell>Pembesuk</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.rincian.map((r, i) => (
                      <TableRow key={`${r.tanggal}-${r.no_urut}-${i}`}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.tanggal)}</TableCell>
                        <TableCell>{String(r.no_urut).padStart(4, '0')}</TableCell>
                        <TableCell>{r.tahanan_nama}</TableCell>
                        <TableCell>
                          {r.pembesuk.map((p) => `${p.nama} (${p.hubungan})`).join('; ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
}