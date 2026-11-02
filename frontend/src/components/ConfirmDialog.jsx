// Dialog konfirmasi umum (hapus, nonaktifkan, verifikasi, dan sebagainya).
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya',
  color = 'primary',
  loading = false,
  error = '',
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <DialogContentText component="div">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button variant="contained" color={color} onClick={onConfirm} disabled={loading}>
          {loading ? 'Memproses...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
