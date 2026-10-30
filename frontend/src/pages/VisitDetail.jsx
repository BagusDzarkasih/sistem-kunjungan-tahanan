// Halaman petugas: detail kunjungan (wireframe 6).
// Data kunjungan, pembesuk satu per satu dengan foto KTP dan foto wajah berdampingan,
// lalu tombol Setujui dan Tolak (hanya untuk status menunggu).
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AuthPhoto from '../components/AuthPhoto';
import StatusChip from '../components/StatusChip';
import { getErrorMessage } from '../services/api';
import { approveVisit, getVisitDetail, rejectVisit } from '../services/visit.service';

// "2026-10-26" -> "26-10-2026"
const formatDate = (s) => (s ? String(s).slice(0, 10).split('-').reverse().join('-') : '-');

// "2026-10-26 14:05:00" -> "26-10-2026 14:05"
function formatDateTime(s) {
  if (!s) return '-';
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}` : String(s);
}

// Satu baris "label: isi"
function Info({ label, children }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', width: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ wordBreak: 'break-word', minWidth: 0 }}>
        {children || '-'}
      </Typography>
    </Box>
  );
}

export default function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0); // naik untuk memuat ulang
  const [result, setResult] = useState({ key: '', visit: null, visitors: [], error: '' });
  const [index, setIndex] = useState(0); // pembesuk yang sedang dilihat
  const [confirm, setConfirm] = useState(null); // 'setujui' | 'tolak' | null
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const queryKey = `${id}|${tick}`;

  useEffect(() => {
    const controller = new AbortController();
    getVisitDetail(id, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setResult({ key: queryKey, visit: r.visit, visitors: r.visitors, error: '' });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const notFound = err.response?.status === 404;
        setResult({
          key: queryKey,
          visit: null,
          visitors: [],
          error: notFound ? 'Kunjungan tidak ditemukan.' : getErrorMessage(err),
        });
      });
    return () => controller.abort();
  }, [id, queryKey]);

  const loading = result.key !== queryKey;
  const { visit, visitors } = result;
  const current = visitors[Math.min(index, Math.max(visitors.length - 1, 0))];

  const closeDialog = () => {
    if (saving) return;
    setConfirm(null);
    setReason('');
    setReasonError('');
  };

  const handleApprove = async () => {
    setSaving(true);
    setActionError('');
    try {
      await approveVisit(id);
      setConfirm(null);
    } catch (err) {
      setConfirm(null);
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setTick((t) => t + 1); // muat ulang: status terbaru ditampilkan
    }
  };

  const handleReject = async () => {
    const text = reason.trim();
    if (text.length < 3) return setReasonError('Alasan minimal 3 huruf');
    if (text.length > 255) return setReasonError('Alasan maksimal 255 karakter');

    setSaving(true);
    setActionError('');
    try {
      await rejectVisit(id, text);
      setConfirm(null);
      setReason('');
      setReasonError('');
    } catch (err) {
      setConfirm(null);
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setTick((t) => t + 1);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/staff/visits')} sx={{ mb: 1 }}>
        Kembali ke daftar
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
            <Button color="inherit" size="small" onClick={() => setTick((t) => t + 1)}>
              Coba lagi
            </Button>
          }
        >
          {result.error}
        </Alert>
      )}

      {!loading && visit && (
        <Stack spacing={2}>
          {actionError && <Alert severity="error">{actionError}</Alert>}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" component="h1">
              Kunjungan {String(visit.no_urut).padStart(4, '0')}
            </Typography>
            <StatusChip status={visit.status} />
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Info label="Tanggal besuk">{formatDate(visit.tanggal)}</Info>
            <Info label="Tahanan">
              {visit.tahanan?.nama}
              {visit.tahanan?.status_verifikasi === 'belum' && (
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label="Nama baru, belum diverifikasi"
                  />
                </Box>
              )}
            </Info>
            <Info label="Jumlah pembesuk">{visitors.length} orang</Info>
            <Info label="Setuju peraturan">
              {visit.setuju_peraturan ? `Ya, ${formatDateTime(visit.waktu_setuju)}` : 'Belum'}
            </Info>
            <Info label="Didaftarkan">{formatDateTime(visit.dibuat_pada)}</Info>
            {visit.didaftarkan_oleh && <Info label="Didaftarkan oleh">{visit.didaftarkan_oleh}</Info>}
            {visit.status !== 'menunggu' && visit.diproses_pada && (
              <Info label="Diproses">
                {formatDateTime(visit.diproses_pada)}
                {visit.diproses_oleh ? ` oleh ${visit.diproses_oleh}` : ''}
              </Info>
            )}
            {visit.status === 'ditolak' && (
              <Info label="Alasan penolakan">{visit.alasan_penolakan}</Info>
            )}
          </Paper>

          {current && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  Pembesuk {Math.min(index, visitors.length - 1) + 1} dari {visitors.length}
                </Typography>
                {visitors.length > 1 && (
                  <Box>
                    <IconButton
                      aria-label="Pembesuk sebelumnya"
                      disabled={index <= 0}
                      onClick={() => setIndex((i) => i - 1)}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    <IconButton
                      aria-label="Pembesuk berikutnya"
                      disabled={index >= visitors.length - 1}
                      onClick={() => setIndex((i) => i + 1)}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mb: 1.5 }} />

              <Info label="Nama">{current.nama}</Info>
              <Info label="NIK">{current.nik}</Info>
              <Info label="Hubungan">{current.hubungan}</Info>
              <Info label="Alamat">{current.alamat}</Info>
              <Info label="No HP">{current.no_hp}</Info>

              {/* Foto KTP dan foto wajah berdampingan, supaya mudah dicocokkan petugas. */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  mt: 2,
                }}
              >
                {current.punya_foto_ktp ? (
                  <AuthPhoto type="ktp" id={current.pembesuk_id} alt="Foto KTP" />
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Foto KTP
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Belum ada foto KTP.
                    </Typography>
                  </Box>
                )}
                <AuthPhoto type="pembesuk" id={current.detail_id} alt="Foto wajah saat kunjungan" />
              </Box>
            </Paper>
          )}

          {visit.status === 'menunggu' && (
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="error" onClick={() => setConfirm('tolak')}>
                Tolak
              </Button>
              <Button variant="contained" color="success" onClick={() => setConfirm('setujui')}>
                Setujui
              </Button>
            </Stack>
          )}
        </Stack>
      )}

      {/* Konfirmasi setuju */}
      <Dialog open={confirm === 'setujui'} onClose={closeDialog}>
        <DialogTitle>Setujui kunjungan ini?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Pastikan data dan foto semua pembesuk sudah sesuai dengan identitas asli.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Batal
          </Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Ya, setujui'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tolak: alasan wajib */}
      <Dialog open={confirm === 'tolak'} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Tolak kunjungan ini?</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            margin="dense"
            label="Alasan penolakan"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError('');
            }}
            error={Boolean(reasonError)}
            helperText={reasonError || `${reason.trim().length}/255 (minimal 3 huruf)`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Tolak kunjungan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}