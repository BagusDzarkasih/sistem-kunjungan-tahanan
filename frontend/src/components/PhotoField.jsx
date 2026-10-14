// Kolom foto: ambil dari kamera (ponsel) atau pilih file (komputer),
// otomatis dikompres, lalu tampil pratinjau.
import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormHelperText,
  Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { compressImage } from '../utils/image';

// capture: 'environment' = kamera belakang (KTP), 'user' = kamera depan (selfie)
export default function PhotoField({ label, value, onChange, error, capture }) {
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const previewRef = useRef('');

  // Bebaskan memori pratinjau saat komponen hilang.
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // supaya foto yang sama bisa dipilih lagi
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalError('File harus berupa foto.');
      return;
    }

    setBusy(true);
    setLocalError('');
    try {
      const blob = await compressImage(file);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = URL.createObjectURL(blob);
      setPreview(previewRef.current);
      onChange(blob);
    } catch {
      setLocalError('Foto tidak dapat diproses. Coba foto lain.');
    } finally {
      setBusy(false);
    }
  };

  const message = localError || error;

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box
        sx={{
          border: 1,
          borderStyle: 'dashed',
          borderColor: message ? 'error.main' : 'divider',
          borderRadius: 1,
          p: 1.5,
          textAlign: 'center',
        }}
      >
        {value && preview && (
          <Box
            component="img"
            src={preview}
            alt={label}
            sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1, mb: 1 }}
          />
        )}
        <Button
          component="label"
          variant="outlined"
          size="small"
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} /> : <CameraAltIcon />}
        >
          {busy ? 'Memproses...' : value ? 'Ganti foto' : 'Ambil foto'}
          <input
            hidden
            type="file"
            accept="image/*"
            capture={capture}
            onChange={handleFile}
          />
        </Button>
        {value && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Ukuran setelah dikompres: {Math.round(value.size / 1024)} KB
          </Typography>
        )}
      </Box>
      {message && <FormHelperText error>{message}</FormHelperText>}
    </Box>
  );
}