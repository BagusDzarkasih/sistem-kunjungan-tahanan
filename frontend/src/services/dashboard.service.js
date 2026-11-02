// GET /api/dashboard?hari=14 (petugas dan admin).
// hari: 7 sampai 31. Selalu dikirim berupa angka (server menolak nilai kosong).
import api from './api';

export async function getDashboard(hari, signal) {
  const { data } = await api.get('/dashboard', { params: { hari }, signal });
  return data;
}