import { ambilAngka } from '../utils/dashboard.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

// GET /api/dashboard
export async function tampil(req, res) {
  try {
    const data = await ambilAngka();

    // Angka berubah setiap ada kunjungan masuk, jadi jangan di-cache
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (err) {
    serverError(res, err);
  }
}