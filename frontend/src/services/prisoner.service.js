// Pemanggil endpoint tahanan (petugas dan admin, butuh login).
//   GET    /api/tahanan?q=&status=&page=&limit=   -> { data, page, limit, total }
//   GET    /api/tahanan/:id                       -> { tahanan, riwayat }
//   POST   /api/tahanan { nama }                  -> 201 { tahanan } (langsung terverifikasi)
//   PUT    /api/tahanan/:id { nama }              -> { tahanan }
//   PATCH  /api/tahanan/:id/verifikasi            -> { tahanan }
//   DELETE /api/tahanan/:id                       -> { pesan } atau 409 MASIH_DIPAKAI
//   GET    /api/tahanan/cari?q=                   -> { data: [{ id, nama }] } (minimal 3 huruf)
//   POST   /api/tahanan/gabung { sumber_id, tujuan_id } -> { pesan, tahanan, kunjungan_dipindah }
import api from './api';

// Filter kosong tidak dikirim (server menolak nilai kosong).
export async function getPrisoners({ q, status, page = 1, limit = 20 }, signal) {
  const params = { page, limit };
  if (q) params.q = q;
  if (status) params.status = status;
  const { data } = await api.get('/tahanan', { params, signal });
  return { rows: data.data ?? [], total: data.total ?? 0 };
}

export async function getPrisoner(id, signal) {
  const { data } = await api.get(`/tahanan/${id}`, { signal });
  return { prisoner: data.tahanan, history: data.riwayat ?? [] };
}

export async function createPrisoner(nama) {
  const { data } = await api.post('/tahanan', { nama });
  return data.tahanan;
}

export async function updatePrisoner(id, nama) {
  const { data } = await api.put(`/tahanan/${id}`, { nama });
  return data.tahanan;
}

export async function verifyPrisoner(id) {
  const { data } = await api.patch(`/tahanan/${id}/verifikasi`);
  return data.tahanan;
}

export async function deletePrisoner(id) {
  const { data } = await api.delete(`/tahanan/${id}`);
  return data;
}

export async function searchPrisoners(q, signal) {
  const { data } = await api.get('/tahanan/cari', { params: { q }, signal });
  return data.data ?? [];
}

export async function mergePrisoners(sumberId, tujuanId) {
  const { data } = await api.post('/tahanan/gabung', { sumber_id: sumberId, tujuan_id: tujuanId });
  return data;
}
