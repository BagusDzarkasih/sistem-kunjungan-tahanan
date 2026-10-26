import { ambilLaporan } from '../utils/laporan.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

// GET /api/laporan/bulanan?bulan=2026-10
export async function bulanan(req, res) {
  try {
    const laporan = await ambilLaporan(req.query.bulan);
    res.json(laporan);
  } catch (err) {
    serverError(res, err);
  }
}