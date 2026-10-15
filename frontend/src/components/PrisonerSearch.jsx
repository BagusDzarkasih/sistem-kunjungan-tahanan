// Nama tahanan: diketik bebas. Setelah 3 huruf muncul saran dari server (opsional).
// Dipilih dari saran -> id terisi (dikirim sebagai tahanan_id).
// Diketik sendiri -> id kosong (dikirim sebagai tahanan_nama_baru).
import { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { searchPrisoners } from '../services/public.service';

const MIN_CHARS = 3;

export default function PrisonerSearch({ id, nama, onChange, onBlur, error }) {
  const [options, setOptions] = useState([]);
  const [failed, setFailed] = useState(false);

  const query = nama.trim();
  const canSearch = query.length >= MIN_CHARS && !id;

  useEffect(() => {
    if (!canSearch) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const list = await searchPrisoners(query, controller.signal);
        if (!controller.signal.aborted) {
          setOptions(list);
          setFailed(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setOptions([]);
          setFailed(true);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, canSearch]);

  let helper = 'Tulis sesuai nama asli tahanan';
  if (id) helper = 'Tahanan dipilih dari daftar';
  else if (failed) helper = 'Saran nama tidak dapat dimuat. Anda tetap bisa mengetik nama lengkap.';
  else if (canSearch) helper = 'Pilih dari saran, atau tetap ketik nama lengkap kalau tidak ada.';

  return (
    <Autocomplete
      freeSolo
      options={canSearch ? options : []}
      inputValue={nama}
      onInputChange={(_, text, reason) => {
        // Hanya saat pembesuk mengetik atau menghapus. Mengetik = bukan pilihan dari daftar.
        if (reason === 'input' || reason === 'clear') onChange({ id: null, nama: text });
      }}
      onChange={(_, selected) => {
        if (selected && typeof selected === 'object') {
          onChange({ id: selected.id, nama: selected.nama });
        }
      }}
      onBlur={onBlur}
      filterOptions={(x) => x} // penyaringan dilakukan server
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.nama ?? '')}
      getOptionKey={(o) => (typeof o === 'string' ? o : o.id)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Nama tahanan yang dibesuk"
          error={Boolean(error)}
          helperText={error || helper}
        />
      )}
    />
  );
}