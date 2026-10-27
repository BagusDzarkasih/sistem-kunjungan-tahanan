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

    // Jangan di-cache supaya perubahan teks oleh admin atau petugas langsung tampil
    res.set('Cache-Control', 'no-store');
    res.json({ teks: rows[0].nilai });
  } catch (err) {
    serverError(res, err);
  }
}

// PUT /api/peraturan (admin dan petugas): ubah teks peraturan besuk
export async function ubah(req, res) {
  try {
    const { teks } = req.body; // sudah divalidasi dan dirapikan oleh peraturanRules

    // kunci bersifat UNIQUE: kalau barisnya sudah ada diperbarui, kalau belum dibuat
    await pool.query(
      `INSERT INTO pengaturan (kunci, nilai) VALUES ('teks_peraturan', ?)
       ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)`,
      [teks]
    );

    res.set('Cache-Control', 'no-store');
    res.json({ teks });
  } catch (err) {
    serverError(res, err);
  }
}