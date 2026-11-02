// Pop-up Tambah / Ubah tahanan: satu kolom Nama (3 sampai 100 karakter).
// prisoner = null -> tambah. prisoner = { id, nama } -> ubah.
import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { getErrorMessage } from '../services/api';
import { createPrisoner, updatePrisoner } from '../services/prisoner.service';
import { getFieldErrors } from '../utils/errors';

// Isi pop-up dipisah supaya state-nya dibuat ulang setiap pop-up dibuka.
function Body({ prisoner, onClose, onSaved }) {
  const isEdit = Boolean(prisoner);
  const [nama, setNama] = useState(prisoner?.nama ?? '');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = nama.trim();
    if (value.length < 3 || value.length > 100) {
      setFieldError('Nama 3 sampai 100 karakter');
      return;
    }
    setSaving(true);
    setError('');
    setFieldError('');
    try {
      const saved = isEdit
        ? await updatePrisoner(prisoner.id, value)
        : await createPrisoner(value);
      onSaved(saved);
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields.nama) setFieldError(fields.nama);
      else setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogTitle>{isEdit ? 'Ubah tahanan' : 'Tambah tahanan'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Nama tahanan"
          value={nama}
          onChange={(e) => {
            setNama(e.target.value);
            setFieldError('');
          }}
          error={Boolean(fieldError)}
          helperText={fieldError || '3 sampai 100 karakter'}
          autoComplete="off"
        />
        {!isEdit && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Tahanan yang ditambah petugas langsung berstatus terverifikasi.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" variant="contained" disabled={saving} sx={{ minHeight: 44 }}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </form>
  );
}

export default function PrisonerFormDialog({ open, prisoner, onClose, onSaved }) {
  const isMobile = useMediaQuery('(max-width:767px)');
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={isMobile}>
      {open && <Body prisoner={prisoner} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}
