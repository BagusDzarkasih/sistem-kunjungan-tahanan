// Halaman publik pendaftaran pembesuk (alamat "/").
// Tahap 1: pop-up peraturan. Tahap 2: formulir data pembesuk dinamis.
import { useState } from 'react';
import { Alert, Box, Chip, Container, Typography } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import Logo from '../components/Logo';
import RulesDialog from '../components/RulesDialog';
import VisitorDataForm from '../components/VisitorDataForm';

// Tanggal besuk otomatis hari ini (tidak diisi manual), contoh: "Rabu, 14 Oktober 2026"
const todayLabel = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function VisitorForm() {
  // Waktu pembesuk menyetujui peraturan. null = belum menyetujui.
  const [acceptedAt, setAcceptedAt] = useState(null);
  // Jumlah pembesuk pada pengiriman terakhir yang lolos validasi.
  const [validCount, setValidCount] = useState(null);

  const handleSubmit = (values) => {
    const payload = {
      waktuSetuju: acceptedAt.toISOString(),
      pembesuk: values.pembesuk,
    };
    // Tahap 2: baru sampai validasi. Pengiriman ke backend ditambahkan di tahap 4.
    console.log('Data siap kirim:', payload);
    setValidCount(values.pembesuk.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

        {acceptedAt && (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Peraturan disetujui pukul{' '}
              {acceptedAt.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              .
            </Alert>

            {validCount !== null && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Data {validCount} pembesuk sudah valid. Pengiriman ke server
                ditambahkan pada tahap berikutnya.
              </Alert>
            )}

            <VisitorDataForm onSubmit={handleSubmit} />
          </>
        )}
      </Container>

      <RulesDialog open={!acceptedAt} onAccept={() => setAcceptedAt(new Date())} />
    </Box>
  );
}