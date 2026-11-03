// Pemanggil endpoint peraturan besuk untuk halaman petugas.
//   GET /api/peraturan          -> { teks } atau 404 "Peraturan belum diatur" (publik)
//   PUT /api/peraturan { teks } -> { teks } (butuh login, teks 10 sampai 5000 karakter)
import api from './api';

// 404 berarti peraturan belum pernah diisi, bukan error: dikembalikan sebagai teks kosong.
export async function getRulesText(signal) {
  try {
    const { data } = await api.get('/peraturan', { signal });
    return data.teks ?? '';
  } catch (err) {
    if (err.response?.status === 404) return '';
    throw err;
  }
}

export async function saveRulesText(teks) {
  const { data } = await api.put('/peraturan', { teks });
  return data.teks;
}