// Label status kunjungan, dipakai di daftar dan halaman detail.
import { Chip } from '@mui/material';

const STATUS = {
  menunggu: { label: 'Menunggu', color: 'warning' },
  disetujui: { label: 'Disetujui', color: 'success' },
  ditolak: { label: 'Ditolak', color: 'error' },
  kedaluwarsa: { label: 'Kedaluwarsa', color: 'default' },
};

export default function StatusChip({ status }) {
  const s = STATUS[status] ?? { label: status || '-', color: 'default' };
  return <Chip size="small" label={s.label} color={s.color} />;
}