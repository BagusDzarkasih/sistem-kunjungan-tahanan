// Halaman admin: Pengaturan sistem (wireframe 13).
// Dua angka: batas waktu kunjungan menunggu sebelum kedaluwarsa, dan masa simpan foto.
import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { getErrorMessage } from '../services/api';
import { getSettings, saveSettings } from '../services/settings.service';
import { getFieldErrors } from '../utils/errors';

const RULES = {
  kedaluwarsa_jam: { min: 1, max: 720, label: 'Batas kedaluwarsa kunjungan (jam)' },
  masa_simpan_foto_bulan: { min: 3, max: 120, label: 'Masa simpan foto (bulan)' },
};

export default function Settings() {
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState({ key: '', data: null, error: '' });
  const [draft, setDraft] = useState(null); // null = belum diubah
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const key = String(tick);

  useEffect(() => {
    const controller = new AbortController();
    getSettings(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setLoaded({ key, data, error: '' });
      })
      .catch((err) => {
        if (!controller.signal.aborted) setLoaded({ key, data: null, error: getErrorMessage(err) });
      });
    return () => controller.abort();
  }, [key]);

  const loading = loaded.key !== key;
  const saved = loaded.data;
  const values = draft ?? {
    kedaluwarsa_jam: String(saved?.kedaluwarsa_jam ?? ''),
    masa_simpan_foto_bulan: String(saved?.masa_simpan_foto_bulan ?? ''),
  };
  const changed =
    saved &&
    (values.kedaluwarsa_jam !== String(saved.kedaluwarsa_jam) ||
      values.masa_simpan_foto_bulan !== String(saved.masa_simpan_foto_bulan));

  const setField = (name) => (e) => {
    setDraft({ ...values, [name]: e.target.value });
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const handleSave = async () => {
    const found = {};
    const payload = {};
    Object.entries(RULES).forEach(([name, rule]) => {
      const text = String(values[name]).trim();
      const n = Number(text);
      if (!/^\d+$/.test(text) || n < rule.min || n > rule.max) {
        found[name] = `Isi angka bulat ${rule.min} sampai ${rule.max}`;
      } else {
        payload[name] = n; // dikirim sebagai angka, bukan teks
      }
    });
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await saveSettings(payload);
      setLoaded({ key, data, error: '' });
      setDraft(null);
      setToast('Pengaturan disimpan');
    } catch (err) {
      const fields = getFieldErrors(err);
      if (Object.keys(fields).length) setErrors(fields);
      else setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 640 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Pengaturan
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && loaded.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setTick((t) => t + 1)}>
              Coba lagi
            </Button>
          }
        >
          {loaded.error}
        </Alert>
      )}

      {!loading && saved && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={RULES.kedaluwarsa_jam.label}
              value={values.kedaluwarsa_jam}
              onChange={setField('kedaluwarsa_jam')}
              error={Boolean(errors.kedaluwarsa_jam)}
              helperText={
                errors.kedaluwarsa_jam ||
                'Kunjungan yang masih menunggu lebih lama dari ini otomatis menjadi kedaluwarsa. Rentang 1 sampai 720 jam.'
              }
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <TextField
              label={RULES.masa_simpan_foto_bulan.label}
              value={values.masa_simpan_foto_bulan}
              onChange={setField('masa_simpan_foto_bulan')}
              error={Boolean(errors.masa_simpan_foto_bulan)}
              helperText={
                errors.masa_simpan_foto_bulan ||
                'Foto pembesuk dihapus otomatis setelah masa ini. Rentang 3 sampai 120 bulan.'
              }
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button
                disabled={!changed || saving}
                onClick={() => {
                  setDraft(null);
                  setErrors({});
                }}
                sx={{ minHeight: 44 }}
              >
                Batalkan perubahan
              </Button>
              <Button variant="contained" disabled={!changed || saving} onClick={handleSave} sx={{ minHeight: 44 }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}