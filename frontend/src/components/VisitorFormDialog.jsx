// Pop-up Tambah / Ubah pembesuk: NIK, nama, alamat, no HP.
// visitor = null -> tambah. visitor = { id, ... } -> ubah.
import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { getErrorMessage } from '../services/api';
import { createVisitor, updateVisitor } from '../services/visitor.service';
import { getFieldErrors } from '../utils/errors';

function validate(v) {
  const e = {};
  if (!/^\d{16}$/.test(v.nik)) e.nik = 'NIK harus 16 digit angka';
  if (v.nama.length < 3 || v.nama.length > 100) e.nama = 'Nama 3 sampai 100 karakter';
  if (v.alamat.length < 5 || v.alamat.length > 500) e.alamat = 'Alamat 5 sampai 500 karakter';
  if (!/^\+?\d{8,15}$/.test(v.no_hp.replace(/[\s-]/g, ''))) e.no_hp = 'No HP harus 8 sampai 15 digit angka';
  return e;
}

function Body({ visitor, onClose, onSaved }) {
  const isEdit = Boolean(visitor);
  const [values, setValues] = useState({
    nik: visitor?.nik ?? '',
    nama: visitor?.nama ?? '',
    alamat: visitor?.alamat ?? '',
    no_hp: visitor?.no_hp ?? '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = {
      nik: values.nik.trim(),
      nama: values.nama.trim(),
      alamat: values.alamat.trim(),
      no_hp: values.no_hp.trim(),
    };
    const found = validate(clean);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEdit ? await updateVisitor(visitor.id, clean) : await createVisitor(clean);
      onSaved(saved);
    } catch (err) {
      const fields = getFieldErrors(err);
      if (err.response?.status === 409) setErrors({ nik: getErrorMessage(err) });
      else if (Object.keys(fields).length) setErrors(fields);
      else setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogTitle>{isEdit ? 'Ubah pembesuk' : 'Tambah pembesuk'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="NIK"
            value={values.nik}
            onChange={set('nik')}
            error={Boolean(errors.nik)}
            helperText={errors.nik || '16 digit angka'}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 16 } }}
            autoComplete="off"
          />
          <TextField
            label="Nama lengkap"
            value={values.nama}
            onChange={set('nama')}
            error={Boolean(errors.nama)}
            helperText={errors.nama}
            autoComplete="off"
          />
          <TextField
            label="Alamat"
            value={values.alamat}
            onChange={set('alamat')}
            error={Boolean(errors.alamat)}
            helperText={errors.alamat}
            multiline
            minRows={2}
          />
          <TextField
            label="No HP"
            value={values.no_hp}
            onChange={set('no_hp')}
            error={Boolean(errors.no_hp)}
            helperText={errors.no_hp || 'Contoh: 081234567890'}
            slotProps={{ htmlInput: { inputMode: 'tel' } }}
            autoComplete="off"
          />
        </Stack>
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

export default function VisitorFormDialog({ open, visitor, onClose, onSaved }) {
  const isMobile = useMediaQuery('(max-width:767px)');
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      {open && <Body visitor={visitor} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}