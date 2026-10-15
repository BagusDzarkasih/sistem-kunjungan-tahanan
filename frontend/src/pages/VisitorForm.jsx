// Halaman publik pendaftaran pembesuk (alamat "/").
// Alur: pop-up peraturan -> formulir -> kirim ke POST /api/kunjungan -> nomor urut.
import { useState } from 'react';
import { Alert, Box, Button, Chip, Container, Paper, Typography } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Logo from '../components/Logo';
import RulesDialog from '../components/RulesDialog';
import VisitorDataForm from '../components/VisitorDataForm';
import { submitVisit } from '../services/public.service';

// Tanggal besuk otomatis hari ini (tidak diisi manual), contoh: "Kamis, 15 Oktober 2026"
const todayLabel = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// Format error backend (kontrak): { kode, pesan }
function getErrorMessage(err) {
  if (!err.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  }
  const { status, data } = err.response;
  const pesan = typeof data === 'string' ? data : data?.pesan ?? data?.message;
  if (pesan) return pesan;
  if (status === 429) return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
  return 'Pendaftaran gagal. Silakan coba lagi.';
}

export default function VisitorForm() {
  // Waktu pembesuk menyetujui peraturan. null = belum menyetujui.
  const [acceptedAt, setAcceptedAt] = useState(null);
  // Balasan backend setelah berhasil. null = formulir masih tampil.
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (values) => {
    setSubmitError('');
    try {
      const data = await submitVisit({
        tahanan: { id: values.tahananId, nama: values.tahananNama },
        tokenCaptcha: '', // TODO: diisi setelah jenis CAPTCHA ditentukan
        pembesuk: values.pembesuk,
      });
      setResult(data ?? {});
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const noUrut = result?.no_urut ?? result?.noUrut;

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
              Pendaftaran terkirim
            </Typography>
            {noUrut && (
              <Typography sx={{ mb: 1 }}>
                Nomor urut: <strong>{noUrut}</strong>
              </Typography>
            )}
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Status: menunggu persetujuan petugas. Tunjukkan layar ini kepada petugas saat
              tiba di lokasi.
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