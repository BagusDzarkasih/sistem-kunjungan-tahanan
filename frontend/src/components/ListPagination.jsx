// Baris bawah daftar: "Menampilkan 1 sampai 20 dari 36" dan tombol halaman.
import { IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function ListPagination({ page, limit, total, loading, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <Stack direction="row" sx={{ p: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>
        {total > 0 ? `Menampilkan ${from} sampai ${to} dari ${total}` : 'Tidak ada data'}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <IconButton
          aria-label="Halaman sebelumnya"
          disabled={page <= 1 || loading}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          aria-label="Halaman berikutnya"
          disabled={page >= totalPages || loading}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRightIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}
