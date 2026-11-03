// Pop-up Tambah / Ubah pengguna (admin).
// user = null -> tambah (nama, username, password, role).
// user = { id, ... } -> ubah (hanya nama dan role, username tidak bisa diubah).
import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { getErrorMessage } from '../services/api';
import { createUser, updateUser } from '../services/user.service';
import { getFieldErrors } from '../utils/errors';

function Body({ user, isSelf, onClose, onSaved }) {
  const isEdit = Boolean(user);
  const [values, setValues] = useState({
    nama: user?.nama ?? '',
    username: user?.username ?? '',
    password: '',
    role: user?.role ?? 'petugas',
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
    const nama = values.nama.trim();
    const username = values.username.trim().toLowerCase();
    const found = {};
    if (nama.length < 3 || nama.length > 100) found.nama = 'Nama 3 sampai 100 karakter';
    if (!isEdit) {
      if (username.length < 3 || username.length > 50) found.username = 'Username 3 sampai 50 karakter';
      else if (!/^[a-z0-9._-]+$/.test(username)) {
        found.username = 'Hanya huruf kecil, angka, titik, garis bawah, dan strip';
      }
      if (values.password.length < 8 || values.password.length > 100) {
        found.password = 'Password 8 sampai 100 karakter';
      }
    }
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEdit
        ? await updateUser(user.id, { nama, role: values.role })
        : await createUser({ nama, username, password: values.password, role: values.role });
      onSaved(saved);
    } catch (err) {
      const fields = getFieldErrors(err);
      if (err.response?.status === 409 && !isEdit) setErrors({ username: getErrorMessage(err) });
      else if (Object.keys(fields).length) setErrors(fields);
      else setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogTitle>{isEdit ? 'Ubah pengguna' : 'Tambah pengguna'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Nama lengkap"
            value={values.nama}
            onChange={set('nama')}
            error={Boolean(errors.nama)}
            helperText={errors.nama}
            autoComplete="off"
          />
          <TextField
            label="Username"
            value={values.username}
            onChange={set('username')}
            disabled={isEdit}
            error={Boolean(errors.username)}
            helperText={errors.username || (isEdit ? 'Username tidak bisa diubah' : 'Huruf kecil, angka, titik, garis bawah, strip')}
            autoComplete="off"
          />
          {!isEdit && (
            <TextField
              label="Password"
              type="password"
              value={values.password}
              onChange={set('password')}
              error={Boolean(errors.password)}
              helperText={errors.password || '8 sampai 100 karakter'}
              autoComplete="new-password"
            />
          )}
          <TextField
            select
            label="Role"
            value={values.role}
            onChange={set('role')}
            disabled={isEdit && isSelf}
            error={Boolean(errors.role)}
            helperText={errors.role || (isEdit && isSelf ? 'Anda tidak bisa menurunkan role akun sendiri' : ' ')}
          >
            <MenuItem value="petugas">Petugas</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
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

export default function UserFormDialog({ open, user, isSelf, onClose, onSaved }) {
  const isMobile = useMediaQuery('(max-width:767px)');
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={isMobile}>
      {open && <Body user={user} isSelf={isSelf} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}