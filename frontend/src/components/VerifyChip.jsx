// Lencana status verifikasi tahanan: "belum" (kuning) atau "terverifikasi" (hijau).
import { Chip } from '@mui/material';

export default function VerifyChip({ status }) {
  return status === 'terverifikasi' ? (
    <Chip size="small" color="success" label="terverifikasi" />
  ) : (
    <Chip size="small" color="warning" variant="outlined" label="belum" />
  );
}
