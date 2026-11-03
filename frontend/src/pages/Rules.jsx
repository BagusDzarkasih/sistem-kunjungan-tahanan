// Halaman petugas: Peraturan Besuk (wireframe 11).
// Teks ini tampil di pop-up pada form pembesuk. Petugas dan admin boleh mengubahnya.
import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { getErrorMessage } from '../services/api';
import { getRulesText, saveRulesText } from '../services/rules.service';
import { getFieldErrors } from '../utils/errors';

const MIN = 10;
const MAX = 5000;

export default function Rules() {
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState({ key: '', saved: '', error: '' });
  const [draft, setDraft] = useState(null); // null = belum diubah, ikut teks tersimpan
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const key = String(tick);

  useEffect(() => {
    const controller = new AbortController();
    getRulesText(controller.signal)
      .then((saved) => {
        if (!controller.signal.aborted) setLoaded({ key, saved, error: '' });
      })
      .catch((err) => {
        if (!controller.signal.aborted) setLoaded({ key, saved: '', error: getErrorMessage(err) });
      });
    return () => controller.abort();
  }, [key]);

  const loading = loaded.key !== key;
  const text = draft ?? loaded.saved;
  const trimmed = text.trim();
  const changed = trimmed !== loaded.saved.trim();
  const tooShort = trimmed.length < MIN;
  const empty = !loading && !loaded.error && loaded.saved === '';

  const handleSave = async () => {
    if (tooShort || trimmed.length > MAX) {
      setFieldError(`Teks peraturan ${MIN} sampai ${MAX} karakter`);
      return;
    }
    setSaving(true);
    setError('');
    setFieldError('');
    try {
      const saved = await saveRulesText(text);
      setLoaded({ key, saved, error: '' });
      setDraft(null);
      setToast('Peraturan disimpan. Pembesuk langsung melihat teks terbaru.');
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields.teks) setFieldError(fields.teks);
      else setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
        Peraturan Besuk
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 2 }}>
        Teks ini muncul di pop-up pada form pembesuk. Pembesuk wajib membacanya sebelum melanjutkan.
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

      {!loading && !loaded.error && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            {empty && (
              <Alert severity="warning">
                Peraturan belum diatur. Selama kosong, pembesuk tidak bisa melanjutkan form.
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Teks peraturan"
              multiline
              minRows={10}
              maxRows={24}
              value={text}
              onChange={(e) => {
                setDraft(e.target.value);
                setFieldError('');
              }}
              error={Boolean(fieldError)}
              helperText={fieldError || `${trimmed.length} / ${MAX} karakter (minimal ${MIN})`}
              fullWidth
            />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button
                disabled={!changed || saving}
                onClick={() => {
                  setDraft(null);
                  setFieldError('');
                }}
                sx={{ minHeight: 44 }}
              >
                Batalkan perubahan
              </Button>
              <Button
                variant="contained"
                disabled={!changed || saving}
                onClick={handleSave}
                sx={{ minHeight: 44 }}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}