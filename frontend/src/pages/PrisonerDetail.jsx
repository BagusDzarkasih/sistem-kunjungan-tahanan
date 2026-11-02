// Halaman petugas: detail tahanan (wireframe 7).
// Data tahanan, tombol Ubah dan Verifikasi, dan riwayat kunjungan tahanan ini.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConfirmDialog from '../components/ConfirmDialog';
import PrisonerFormDialog from '../components/PrisonerFormDialog';
import StatusChip from '../components/StatusChip';
import VerifyChip from '../components/VerifyChip';
import { getErrorMessage } from '../services/api';
import { getPrisoner, verifyPrisoner } from '../services/prisoner.service';
import { formatDate, formatDateTime } from '../utils/format';

export default function PrisonerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:767px)');
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: '', prisoner: null, history: [], error: '' });
  const [editing, setEditing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [toast, setToast] = useState('');

  const queryKey = `${id}|${tick}`;

  useEffect(() => {
    const controller = new AbortController();
    getPrisoner(id, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setResult({ key: queryKey, prisoner: r.prisoner, history: r.history, error: '' });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({
          key: queryKey,
          prisoner: null,
          history: [],
          error: err.response?.status === 404 ? 'Tahanan tidak ditemukan.' : getErrorMessage(err),
        });
      });
    return () => controller.abort();
  }, [id, queryKey]);

  const loading = result.key !== queryKey;
  const { prisoner, history } = result;
  const reload = () => setTick((t) => t + 1);

  const handleVerify = async () => {
    setBusy(true);
    setDialogError('');
    try {
      await verifyPrisoner(id);
      setVerifying(false);
      setToast('Tahanan sudah diverifikasi');
      reload();
    } catch (err) {
      setDialogError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/staff/prisoners')} sx={{ mb: 1 }}>
        Kembali ke daftar tahanan
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && result.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Coba lagi
            </Button>
          }
        >
          {result.error}
        </Alert>
      )}

      {!loading && prisoner && (
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" component="h1">
              {prisoner.nama}
            </Typography>
            <VerifyChip status={prisoner.status_verifikasi} />
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Dibuat: {formatDate(prisoner.dibuat_pada)}
              {prisoner.status_verifikasi === 'terverifikasi' &&
                ` · Diverifikasi: ${formatDateTime(prisoner.diverifikasi_pada)}`}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="outlined" sx={{ minHeight: 44 }} onClick={() => setEditing(true)}>
                Ubah
              </Button>
              {prisoner.status_verifikasi === 'belum' && (
                <Button
                  variant="contained"
                  color="success"
                  sx={{ minHeight: 44 }}
                  onClick={() => setVerifying(true)}
                >
                  Verifikasi
                </Button>
              )}
            </Stack>
          </Paper>

          <Typography variant="h6" component="h2">
            Riwayat kunjungan
          </Typography>

          {history.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography sx={{ color: 'text.secondary' }}>
                Belum ada kunjungan untuk tahanan ini.
              </Typography>
            </Paper>
          ) : isMobile ? (
            <Paper variant="outlined">
              <Stack divider={<Divider />}>
                {history.map((h) => (
                  <Box key={h.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {String(h.no_urut).padStart(4, '0')}
                      </Typography>
                      <StatusChip status={h.status} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(h.tanggal)}, {h.jumlah_pembesuk} pembesuk
                      </Typography>
                      <Button size="small" sx={{ minHeight: 44 }} onClick={() => navigate(`/staff/visits/${h.id}`)}>
                        Lihat
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          ) : (
            <Paper variant="outlined">
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>Tanggal</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Pembesuk</TableCell>
                      <TableCell align="right">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id} hover>
                        <TableCell>{String(h.no_urut).padStart(4, '0')}</TableCell>
                        <TableCell>{formatDate(h.tanggal)}</TableCell>
                        <TableCell>
                          <StatusChip status={h.status} />
                        </TableCell>
                        <TableCell>{h.jumlah_pembesuk} orang</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => navigate(`/staff/visits/${h.id}`)}>
                            Lihat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Stack>
      )}

      <PrisonerFormDialog
        open={editing}
        prisoner={prisoner}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          setToast('Nama tahanan disimpan');
          reload();
        }}
      />

      <ConfirmDialog
        open={verifying}
        title="Verifikasi tahanan?"
        message="Tandai tahanan ini sebagai terverifikasi (nama sudah dicocokkan dengan data resmi)."
        confirmLabel="Verifikasi"
        color="success"
        loading={busy}
        error={dialogError}
        onConfirm={handleVerify}
        onClose={() => {
          if (busy) return;
          setVerifying(false);
          setDialogError('');
        }}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
