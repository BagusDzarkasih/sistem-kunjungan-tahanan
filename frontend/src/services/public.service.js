// Pemanggil endpoint publik (tanpa login) untuk form pembesuk.
import api from './api';

// GET /peraturan -> teks peraturan untuk pop-up.
// Bentuk balasan belum dipastikan di Kontrak API, jadi dua kemungkinan
// ditangani: teks langsung, atau objek { peraturan: '...' }.
export async function getRules() {
  const { data } = await api.get('/peraturan');
  if (typeof data === 'string') return data;
  return data.peraturan ?? data.nilai ?? '';
}