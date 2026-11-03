// Pop-up reset password pengguna (admin): password baru 8 sampai 100 karakter.
import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { getErrorMessage } from '../services/api';
import { resetUserPassword } from '../services/user.service';
import { getFieldErrors } from '../utils/errors';

function Body({ user, onClose, onDone }) {
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8 || password.length > 100) {
      setFieldError('Password 8 sampai 100 karakter');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await resetUserPassword(user.id, password);
      onDone();
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields.password_baru) setFieldError(fields.password_baru);
      else setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Atur password baru untuk <strong>{user.nama}</strong> ({user.username}). Sampaikan password ini
          langsung kepada yang bersangkutan.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          type="password"
          label="Password baru"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldError('');
          }}
          error={Boolean(fieldError)}
          helperText={fieldError || '8 sampai 100 karakter'}
          autoComplete="new-password"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" variant="contained" disabled={saving} sx={{ minHeight: 44 }}>
          {saving ? 'Menyimpan...' : 'Simpan password'}
        </Button>
      </DialogActions>
    </form>
  );
}

export default function ResetPasswordDialog({ open, user, onClose, onDone }) {
  const isMobile = useMediaQuery('(max-width:767px)');
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={isMobile}>
      {open && user && <Body user={user} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}