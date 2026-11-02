// Pop-up Gabung tahanan: semua kunjungan tahanan sumber dipindah ke tujuan,
// lalu data sumber dihapus. Tidak bisa dibatalkan.
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import useDebounced from '../hooks/useDebounced';
import { getErrorMessage } from '../services/api';
import { mergePrisoners, searchPrisoners } from '../services/prisoner.service';

function Body({ source, onClose, onMerged }) {
  const [text, setText] = useState('');
  const q = useDebounced(text.trim());
  const [found, setFound] = useState({ q: '', rows: [], failed: false });
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSearch = q.length >= 3;

  useEffect(() => {
    if (!canSearch) return undefined;
    const controller = new AbortController();
    searchPrisoners(q, controller.signal)
      .then((rows) => {
        if (!controller.signal.aborted) setFound({ q, rows, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFound({ q, rows: [], failed: true });
      });
    return () => controller.abort();
  }, [q, canSearch]);

  const searching = canSearch && found.q !== q;
  // Tahanan sumber disembunyikan dari hasil.
  const rows = canSearch && found.q === q ? found.rows.filter((r) => r.id !== source.id) : [];

  const handleMerge = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await mergePrisoners(source.id, target.id);
      onMerged(result);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <>
      <DialogTitle>Gabung tahanan</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Sumber (akan dihapus):
        </Typography>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>{source.nama}</Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!target && (
          <>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Cari tujuan (minimal 3 huruf)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
            />
            <Box sx={{ minHeight: 120, mt: 1 }}>
              {searching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {!searching && found.failed && canSearch && (
                <Alert severity="error">Pencarian gagal. Coba lagi.</Alert>
              )}
              {!searching && canSearch && !found.failed && rows.length === 0 && (
                <Typography sx={{ py: 2, color: 'text.secondary' }}>Tidak ada hasil.</Typography>
              )}
              <List dense>
                {rows.map((r) => (
                  <ListItemButton key={r.id} onClick={() => setTarget(r)} sx={{ minHeight: 44 }}>
                    <ListItemText primary={r.nama} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </>
        )}

        {target && (
          <Alert severity="warning">
            Semua kunjungan <strong>{source.nama}</strong> akan dipindah ke{' '}
            <strong>{target.nama}</strong>, lalu <strong>{source.nama}</strong> dihapus. Tindakan ini
            tidak bisa dibatalkan.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {target && (
          <Button onClick={() => setTarget(null)} disabled={saving}>
            Ganti tujuan
          </Button>
        )}
        <Button onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="warning"
          disabled={!target || saving}
          onClick={handleMerge}
          sx={{ minHeight: 44 }}
        >
          {saving ? 'Menggabungkan...' : 'Gabungkan'}
        </Button>
      </DialogActions>
    </>
  );
}

export default function MergeDialog({ open, source, onClose, onMerged }) {
  const isMobile = useMediaQuery('(max-width:767px)');
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      {open && source && <Body source={source} onClose={onClose} onMerged={onMerged} />}
    </Dialog>
  );
}
