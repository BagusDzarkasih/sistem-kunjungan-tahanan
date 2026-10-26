import pool from '../config/db.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

// GET /api/peraturan (publik): teks peraturan besuk untuk pop-up di form pembesuk
export async function ambil(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT nilai FROM pengaturan WHERE kunci = 'teks_peraturan'"
    );
    if (!rows[0]) {
      return res
        .status(404)
        .json({ kode: 'TIDAK_DITEMUKAN', pesan: 'Peraturan belum diatur' });
    }

    // Jangan di-cache supaya perubahan teks oleh admin langsung tampil
    res.set('Cache-Control', 'no-store');
    res.json({ teks: rows[0].nilai });
  } catch (err) {
    serverError(res, err);
  }
}