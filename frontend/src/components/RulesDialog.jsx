// Pop-up peraturan besuk. Muncul pertama kali di halaman form pembesuk.
// Pembesuk wajib mencentang persetujuan sebelum bisa melanjutkan.
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { getRules } from '../services/public.service';

// Hanya dipakai saat pengembangan, selagi endpoint /peraturan belum ada.
// Ini contoh, bukan peraturan resmi.
const SAMPLE_RULES = `1. Pembesuk wajib membawa kartu identitas asli (KTP).
2. Pembesuk wajib mengisi data dengan benar dan jujur.
3. Dilarang membawa barang terlarang ke area kunjungan.
4. Pembesuk wajib mengikuti arahan petugas selama kunjungan.
5. Petugas berhak menolak kunjungan jika data tidak sesuai.`;

export default function RulesDialog({ open, onAccept }) {
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSample, setIsSample] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Naik 1 setiap kali pembesuk menekan "Coba lagi", memicu ambil ulang.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getRules()
      .then((text) => {
        if (cancelled) return;
        setRules(text);
        setIsSample(false);
      })
      .catch(() => {
        if (cancelled) return;
        if (import.meta.env.DEV) {
          // Mode pengembangan: pakai contoh supaya halaman tetap bisa dicoba.
          setRules(SAMPLE_RULES);
          setIsSample(true);
        } else {
          // Di produksi, pembesuk tidak boleh menyetujui teks yang bukan asli.
          setError('Peraturan tidak dapat dimuat. Periksa koneksi lalu coba lagi.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setLoading(true);
    setError('');
    setAttempt((n) => n + 1);
  };

  const canContinue = agreed && !loading && !error && rules.trim() !== '';

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      // Tidak bisa ditutup dengan klik di luar atau tombol Esc.
      // Satu-satunya jalan lanjut: mencentang lalu menekan "Lanjutkan".
      onClose={() => {}}
      disableEscapeKeyDown
      aria-labelledby="rules-title"
    >
      <DialogTitle id="rules-title" sx={{ fontWeight: 700 }}>
        Peraturan Besuk
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={retry}>
                Coba lagi
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            {isSample && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Contoh peraturan (mode pengembangan, backend belum menyediakan
                /peraturan).
              </Alert>
            )}
            <Typography sx={{ whiteSpace: 'pre-line' }}>{rules}</Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, p: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={loading || Boolean(error)}
            />
          }
          label="Saya sudah membaca dan menyetujui peraturan di atas"
        />
        <Button
          variant="contained"
          size="large"
          disabled={!canContinue}
          onClick={onAccept}
        >
          Lanjutkan
        </Button>
      </DialogActions>
    </Dialog>
  );
}