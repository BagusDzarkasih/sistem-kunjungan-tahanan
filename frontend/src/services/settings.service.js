// Pemanggil endpoint pengaturan sistem (khusus admin).
//   GET /api/pengaturan -> { kedaluwarsa_jam, masa_simpan_foto_bulan }
//   PUT /api/pengaturan { kedaluwarsa_jam: 1..720, masa_simpan_foto_bulan: 3..120 }
//     Kedua nilai wajib dikirim sebagai angka bulat (bukan teks).
import api from './api';

export async function getSettings(signal) {
  const { data } = await api.get('/pengaturan', { signal });
  return data;
}

export async function saveSettings(values) {
  const { data } = await api.put('/pengaturan', values);
  return data;
}