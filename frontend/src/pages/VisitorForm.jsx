// Halaman publik pendaftaran pembesuk (alamat "/"), dibuka lewat link atau QR.
// Alur: pop-up peraturan -> formulir -> POST /api/kunjungan -> nomor registrasi.
// Nomor registrasi disimpan di perangkat sampai hari berganti atau pembesuk menekan "Selesai",
// jadi tetap tampil kalau halaman di-refresh atau dibuka ulang.
import { useState } from 'react';
import { Alert, Box, Button, Chip, Container, Paper, Typography } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Logo from '../components/Logo';
import RulesDialog from '../components/RulesDialog';
import VisitorDataForm from '../components/VisitorDataForm';
import { submitVisit } from '../services/public.service';

const STORAGE_KEY = 'kunjungan-terakhir';

// Tanggal lokal perangkat, format YYYY-MM-DD.
const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Penyimpanan browser bisa diblokir (mode privat dsb.), jadi selalu dibungkus try/catch.
function loadRecord() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (record?.tanggal !== dateKey()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

function saveRecord(record) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Diabaikan: nomor tetap tampil di layar, hanya tidak tersimpan.
  }
}

function clearRecord() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Diabaikan.
  }
}

// Tanggal dan hari besuk otomatis hari ini (tidak diisi manual), contoh: "Kamis, 15 Oktober 2026"
const todayLabel = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// Format error backend: { kode, pesan, errors? }
function getErrorMessage(err) {
  if (!err.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  }
  const { status, data } = err.response;
  const pesan = data?.pesan ?? data?.message;
  const detail = Array.isArray(data?.errors)
    ? data.errors
        .map((e) => e?.pesan ?? e?.msg ?? e?.message)
        .filter(Boolean)
        .join(' ')
    : '';
  const text = [pesan, detail].filter(Boolean).join(' ');
  if (text) return text;
  if (status === 429) return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
  return 'Pendaftaran gagal. Silakan coba lagi.';
}

export default function VisitorForm() {
  // Sudah mencentang dan menekan "Lanjut" pada pop-up peraturan.
  const [accepted, setAccepted] = useState(false);
  // Pendaftaran yang sudah terkirim hari ini: { noUrut, waNumber, tanggal }. null = belum ada.
  const [done, setDone] = useState(loadRecord);
  const [submitError, setSubmitError] = useState('');
  // Naik 1 setiap "Selesai": pop-up peraturan dimuat ulang dari awal.
  const [round, setRound] = useState(0);

  const handleSubmit = async (values) => {
    setSubmitError('');
    try {
      const data = await submitVisit({
        tahanan: { id: values.tahananId, nama: values.tahananNama },
        alamat: values.alamat,
        noWhatsapp: values.noWhatsapp,
        tokenCaptcha: values.captcha,
        pembesuk: values.pembesuk,
      });
      const rawNo = data?.no_urut ?? data?.noUrut;
      const record = {
        noUrut: rawNo != null ? String(rawNo).padStart(4, '0') : null,
        waNumber: values.noWhatsapp,
        tanggal: dateKey(),
      };
      saveRecord(record);
      setDone(record);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finish = () => {
    clearRecord();
    setDone(null);
    setSubmitError('');
    setAccepted(false);
    setRound((n) => n + 1);
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
          <Typography sx={{ fontWeight: 700 }}>Kunjungan Tahanan</Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        {done === null && (
          <>
            <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
              Daftar kunjungan
            </Typography>
            <Chip
              icon={<EventIcon />}
              label={`Tanggal besuk: ${todayLabel}`}
              color="primary"
              variant="outlined"
              sx={{ mb: 3 }}
            />

            {accepted && (
              <>
                {submitError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {submitError}
                  </Alert>
                )}
                <VisitorDataForm onSubmit={handleSubmit} />
              </>
            )}
          </>
        )}

        {done !== null && (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Pendaftaran terkirim
            </Typography>
            {done.noUrut && (
              <>
                <Typography sx={{ color: 'text.secondary' }}>Nomor registrasi</Typography>
                <Typography variant="h3" component="p" sx={{ fontWeight: 700, mb: 1 }}>
                  {done.noUrut}
                </Typography>
              </>
            )}
            <Chip label="Menunggu verifikasi" color="warning" sx={{ mb: 2 }} />
            <Typography sx={{ color: 'text.secondary', mb: 1 }}>
              Tanggal besuk: {todayLabel}
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 1 }}>
              Petugas akan memeriksa data Anda. Informasi persetujuan akan dikirim ke WhatsApp{' '}
              <strong>{done.waNumber}</strong>.
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              Tunjukkan nomor registrasi ini ke petugas di loket. Nomor ini tetap tampil kalau
              halaman dibuka ulang di perangkat ini.
            </Typography>
            <Button variant="contained" onClick={finish}>
              Selesai
            </Button>
          </Paper>
        )}
      </Container>

      <RulesDialog
        key={round}
        open={!accepted && done === null}
        onAccept={() => setAccepted(true)}
      />
    </Box>
  );
}