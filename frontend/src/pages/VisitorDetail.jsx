// Halaman petugas: detail pembesuk (wireframe 9).
// Data diri, foto KTP (bisa diganti), tombol Ubah, dan riwayat kunjungan pembesuk ini.
import { useEffect, useRef, useState } from 'react';
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
import AuthPhoto from '../components/AuthPhoto';
import StatusChip from '../components/StatusChip';
import VisitorFormDialog from '../components/VisitorFormDialog';
import { getErrorMessage } from '../services/api';
import { getVisitor, uploadVisitorKtp } from '../services/visitor.service';
import { formatDate } from '../utils/format';
import { compressImage } from '../utils/image';

function Field({ label, children }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography sx={{ wordBreak: 'break-word' }}>{children}</Typography>
    </Box>
  );
}

export default function VisitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:767px)');
  const fileRef = useRef(null);
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: '', visitor: null, history: [], error: '' });
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [toast, setToast] = useState('');

  const queryKey = `${id}|${tick}`;

  useEffect(() => {
    const controller = new AbortController();
    getVisitor(id, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setResult({ key: queryKey, visitor: r.visitor, history: r.history, error: '' });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({
          key: queryKey,
          visitor: null,
          history: [],
          error: err.response?.status === 404 ? 'Pembesuk tidak ditemukan.' : getErrorMessage(err),
        });
      });
    return () => controller.abort();
  }, [id, queryKey]);

  const loading = result.key !== queryKey;
  const { visitor, history } = result;
  const reload = () => setTick((t) => t + 1);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa foto.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const blob = await compressImage(file);
      await uploadVisitorKtp(id, blob);
      setPhotoVersion((v) => v + 1);
      setToast('Foto KTP disimpan');
      reload();
    } catch (err) {
      setUploadError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/staff/visitors')} sx={{ mb: 1 }}>
        Kembali ke daftar pembesuk
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

      {!loading && visitor && (
        <Stack spacing={2}>
          <Typography variant="h5" component="h1">
            {visitor.nama}
          </Typography>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
                gap: 3,
              }}
            >
              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <Field label="NIK">{visitor.nik}</Field>
                <Field label="Alamat">{visitor.alamat}</Field>
                <Field label="No HP">{visitor.no_hp}</Field>
                <Field label="Terdaftar">{formatDate(visitor.dibuat_pada)}</Field>
                <Box>
                  <Button variant="outlined" sx={{ minHeight: 44 }} onClick={() => setEditing(true)}>
                    Ubah data
                  </Button>
                </Box>
              </Stack>

              <Box sx={{ minWidth: 0 }}>
                {visitor.punya_foto_ktp ? (
                  <AuthPhoto key={photoVersion} type="ktp" id={visitor.id} alt="Foto KTP" />
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Foto KTP
                    </Typography>
                    <Box
                      sx={{
                        aspectRatio: '4 / 3',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Belum punya foto KTP
                      </Typography>
                    </Box>
                  </Box>
                )}
                {uploadError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {uploadError}
                  </Alert>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={uploading}
                  sx={{ mt: 1, minHeight: 44 }}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? 'Mengunggah...' : visitor.punya_foto_ktp ? 'Ganti foto KTP' : 'Unggah foto KTP'}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Typography variant="h6" component="h2">
            Riwayat kunjungan
          </Typography>

          {history.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography sx={{ color: 'text.secondary' }}>Belum ada kunjungan untuk pembesuk ini.</Typography>
            </Paper>
          ) : isMobile ? (
            <Paper variant="outlined">
              <Stack divider={<Divider />}>
                {history.map((h) => (
                  <Box key={h.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 700 }}>{String(h.no_urut).padStart(4, '0')}</Typography>
                      <StatusChip status={h.status} />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formatDate(h.tanggal)} · {h.tahanan_nama} · {h.hubungan}
                    </Typography>
                    <Button size="small" sx={{ minHeight: 44 }} onClick={() => navigate(`/staff/visits/${h.id}`)}>
                      Lihat
                    </Button>
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
                      <TableCell>Tahanan</TableCell>
                      <TableCell>Hubungan</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id} hover>
                        <TableCell>{String(h.no_urut).padStart(4, '0')}</TableCell>
                        <TableCell>{formatDate(h.tanggal)}</TableCell>
                        <TableCell>{h.tahanan_nama}</TableCell>
                        <TableCell>{h.hubungan}</TableCell>
                        <TableCell>
                          <StatusChip status={h.status} />
                        </TableCell>
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

      <VisitorFormDialog
        open={editing}
        visitor={visitor}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          setToast('Data pembesuk disimpan');
          reload();
        }}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}