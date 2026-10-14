// Halaman publik pendaftaran pembesuk (alamat "/").
// Tahap 1: pop-up peraturan. Tahap 2-3: formulir. Tahap 4: foto + kirim ke backend.
import { useState } from 'react';
import { Alert, Box, Button, Chip, Container, Paper, Typography } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Logo from '../components/Logo';
import RulesDialog from '../components/RulesDialog';
import VisitorDataForm from '../components/VisitorDataForm';
import { submitVisit } from '../services/public.service';

// Tanggal besuk otomatis hari ini (tidak diisi manual), contoh: "Rabu, 14 Oktober 2026"
const todayLabel = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function getErrorMessage(err) {
  if (!err.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  }
  const data = err.response.data;
  return (
    (typeof data === 'string' ? data : data?.message ?? data?.error) ||
    'Pendaftaran gagal. Silakan coba lagi.'
  );
}

export default function VisitorForm() {
  // Waktu pembesuk menyetujui peraturan. null = belum menyetujui.
  const [acceptedAt, setAcceptedAt] = useState(null);
  // Balasan backend setelah pendaftaran berhasil. null = belum / formulir tampil.
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSubmit = async (values) => {
    setSubmitError('');
    try {
      const data = await submitVisit({
        namaTahanan: values.tahanan.trim(),
        waktuSetuju: acceptedAt.toISOString(),
        pembesuk: values.pembesuk,
      });
      setResult(data ?? {});
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
    scrollTop();
  };

  const kode =
    result && typeof result === 'object'
      ? result.kode ?? result.kodeKunjungan ?? result.kode_kunjungan ?? result.nomorAntrian
      : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          py: 1.5,
        }}
      >
        <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Logo size={36} />
          <Typography fontWeight={700}>Kunjungan Tahanan</Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
          Pendaftaran Pembesuk
        </Typography>
        <Chip
          icon={<EventIcon />}
          label={`Tanggal besuk: ${todayLabel}`}
          color="primary"
          variant="outlined"
          sx={{ mb: 3 }}
        />

        {acceptedAt && result === null && (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Peraturan disetujui pukul{' '}
              {acceptedAt.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              .
            </Alert>

            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            <VisitorDataForm onSubmit={handleSubmit} />
          </>
        )}

        {result !== null && (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Pendaftaran berhasil
            </Typography>
            {kode && (
              <Typography sx={{ mb: 1 }}>
                Kode kunjungan: <strong>{kode}</strong>
              </Typography>
            )}
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Tunjukkan layar ini kepada petugas saat tiba di lokasi.
            </Typography>
            <Button variant="outlined" onClick={() => setResult(null)}>
              Daftarkan pembesuk lain
            </Button>
          </Paper>
        )}
      </Container>

      <RulesDialog open={!acceptedAt} onAccept={() => setAcceptedAt(new Date())} />
    </Box>
  );
}