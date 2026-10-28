import { ambilDashboard, HARI_BAWAAN } from '../utils/dashboard.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

// GET /api/dashboard?hari=14
export async function tampil(req, res) {
  const hari = req.query.hari ? Number(req.query.hari) : HARI_BAWAAN;

  try {
    const data = await ambilDashboard(hari);

    // Angka berubah setiap ada kunjungan masuk, jadi jangan di-cache
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (err) {
    serverError(res, err);
  }
}