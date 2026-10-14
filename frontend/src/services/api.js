// Instance Axios yang dipakai semua halaman untuk memanggil backend.
// Alamat dasar diambil dari file .env (VITE_API_URL), bukan ditulis di kode.
import axios from 'axios';

export const TOKEN_KEY = 'visit_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Sebelum setiap permintaan dikirim: sisipkan token login (kalau ada).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Setelah balasan diterima: kalau server menjawab 401 (token salah atau
// kedaluwarsa) pada halaman selain login, hapus token dan kembali ke login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Mengambil teks pesan error yang siap ditampilkan ke pengguna.
// Format error backend: { kode, pesan } (sesuai Kontrak API).
export function getErrorMessage(error) {
  if (error.response?.data?.pesan) return error.response.data.pesan;
  if (error.response?.status === 429) {
    return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
  }
  if (!error.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi atau coba lagi.';
  }
  return 'Terjadi kesalahan. Coba lagi.';
}

export default api;