// Pemanggil endpoint pembesuk (petugas dan admin, butuh login).
//   GET    /api/pembesuk?q=&page=&limit=  -> { data, page, limit, total }
//   GET    /api/pembesuk/:id              -> { pembesuk, riwayat }
//   POST   /api/pembesuk { nik, nama, alamat, no_hp }  -> 201 { pembesuk }
//   PUT    /api/pembesuk/:id { nik, nama, alamat, no_hp } -> { pembesuk }
//   PUT    /api/pembesuk/:id/foto-ktp (field foto_ktp) -> { pembesuk }
//   DELETE /api/pembesuk/:id              -> { pesan } atau 409 MASIH_DIPAKAI
import api from './api';

export async function getVisitors({ q, page = 1, limit = 20 }, signal) {
  const params = { page, limit };
  if (q) params.q = q;
  const { data } = await api.get('/pembesuk', { params, signal });
  return { rows: data.data ?? [], total: data.total ?? 0 };
}

export async function getVisitor(id, signal) {
  const { data } = await api.get(`/pembesuk/${id}`, { signal });
  return { visitor: data.pembesuk, history: data.riwayat ?? [] };
}

export async function createVisitor(values) {
  const { data } = await api.post('/pembesuk', values);
  return data.pembesuk;
}

export async function updateVisitor(id, values) {
  const { data } = await api.put(`/pembesuk/${id}`, values);
  return data.pembesuk;
}

export async function uploadVisitorKtp(id, blob) {
  const form = new FormData();
  form.append('foto_ktp', blob, 'ktp.jpg');
  const { data } = await api.put(`/pembesuk/${id}/foto-ktp`, form);
  return data.pembesuk;
}

export async function deleteVisitor(id) {
  const { data } = await api.delete(`/pembesuk/${id}`);
  return data;
}