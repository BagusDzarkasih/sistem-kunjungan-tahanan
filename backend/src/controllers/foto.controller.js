import path from 'node:path';
import pool from '../config/db.js';
import { lokasiFoto } from '../utils/foto.js';

const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png' };

// ktp      -> :id adalah pembesuk.id
// pembesuk -> :id adalah detail_kunjungan.id (foto pembesuk diambil setiap kunjungan)
const SQL = {
  ktp: 'SELECT foto_ktp AS path FROM pembesuk WHERE id = ?',
  pembesuk: 'SELECT foto_pembesuk AS path FROM detail_kunjungan WHERE id = ?',
};

const tidakDitemukan = (res) =>
  res.status(404).json({ kode: 'TIDAK_DITEMUKAN', pesan: 'Belum Punya Foto KTP' });

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

export async function tampilkan(req, res) {
  const { jenis } = req.params;
  const id = Number(req.params.id);

  try {
    const [rows] = await pool.query(SQL[jenis], [id]);
    const lokasi = lokasiFoto(rows[0]?.path);
    if (!lokasi) return tidakDitemukan(res);

    const mime = MIME[path.extname(lokasi).toLowerCase()];
    if (!mime) return tidakDitemukan(res);

    res.set({
      'Content-Type': mime,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });

    return res.sendFile(lokasi, { etag: false, lastModified: false }, (err) => {
      if (!err || res.headersSent) return;
      // File tercatat di database tetapi hilang dari disk
      if (err.code === 'ENOENT' || err.status === 404) return tidakDitemukan(res);
      return serverError(res, err);
    });
  } catch (err) {
    return serverError(res, err);
  }
}