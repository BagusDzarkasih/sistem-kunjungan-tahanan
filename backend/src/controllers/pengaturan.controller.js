import pool from '../config/db.js';
import { bacaPengaturan } from '../utils/pengaturan.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

// GET /api/pengaturan (admin): { kedaluwarsa_jam, masa_simpan_foto_bulan } sebagai angka
export async function ambil(req, res) {
  try {
    res.json(await bacaPengaturan());
  } catch (err) {
    serverError(res, err);
  }
}

// PUT /api/pengaturan (admin): kedua nilai wajib dikirim
export async function ubah(req, res) {
  const { kedaluwarsa_jam, masa_simpan_foto_bulan } = req.body; // sudah divalidasi

  try {
    // Satu query untuk dua baris, jadi keduanya tersimpan atau tidak sama sekali
    await pool.query(
      `INSERT INTO pengaturan (kunci, nilai)
       VALUES ('kedaluwarsa_jam', ?), ('masa_simpan_foto_bulan', ?)
       ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)`,
      [String(kedaluwarsa_jam), String(masa_simpan_foto_bulan)]
    );
    res.json(await bacaPengaturan());
  } catch (err) {
    serverError(res, err);
  }
}