// Pemanggil endpoint pengguna (khusus admin).
//   GET   /api/pengguna?q=&role=&aktif=&page=&limit= -> { data, page, limit, total }
//   POST  /api/pengguna { nama, username, password, role } -> 201 { pengguna }
//   PUT   /api/pengguna/:id { nama, role }        -> { pengguna }
//   PATCH /api/pengguna/:id/aktif { aktif: true|false } -> { pengguna }
//   PATCH /api/pengguna/:id/password { password_baru } -> { pesan }
import api from './api';

// Filter kosong tidak dikirim (server menolak nilai kosong).
export async function getUsers({ q, role, aktif, page = 1, limit = 20 }, signal) {
  const params = { page, limit };
  if (q) params.q = q;
  if (role) params.role = role;
  if (aktif) params.aktif = aktif;
  const { data } = await api.get('/pengguna', { params, signal });
  return { rows: data.data ?? [], total: data.total ?? 0 };
}

export async function createUser(values) {
  const { data } = await api.post('/pengguna', values);
  return data.pengguna;
}

export async function updateUser(id, { nama, role }) {
  const { data } = await api.put(`/pengguna/${id}`, { nama, role });
  return data.pengguna;
}

export async function setUserActive(id, aktif) {
  const { data } = await api.patch(`/pengguna/${id}/aktif`, { aktif });
  return data.pengguna;
}

export async function resetUserPassword(id, passwordBaru) {
  const { data } = await api.patch(`/pengguna/${id}/password`, { password_baru: passwordBaru });
  return data;
}