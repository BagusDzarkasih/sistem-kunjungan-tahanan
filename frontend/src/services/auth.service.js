// Pemanggil endpoint login. Bentuk balasan mengikuti backend yang sudah jadi:
//   POST /auth/login -> { token, pengguna: { id, nama, username, role } }
//   GET  /auth/me    -> { pengguna: { id, nama, username, role } }
import api from './api';

export async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.pengguna;
}