// Halaman publik pendaftaran pembesuk (alamat "/").
// Tahap 1: pop-up peraturan. Formulir data pembesuk ditambahkan di tahap berikutnya.
import { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import Logo from '../components/Logo';
import RulesDialog from '../components/RulesDialog';

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
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">
                Formulir data pembesuk akan ditambahkan pada langkah berikutnya.
              </Typography>
            </Paper>
          </>
        )}
      </Container>

      <RulesDialog open={!acceptedAt} onAccept={() => setAcceptedAt(new Date())} />
    </Box>
  );
}