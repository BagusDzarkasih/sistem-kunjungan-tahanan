import pool from '../config/db.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

const tidakDitemukan = (res) =>
  res.status(404).json({ kode: 'TIDAK_DITEMUKAN', pesan: 'Data kunjungan tidak ditemukan' });

// GET /api/kunjungan?page&limit&status&dari&sampai&q
export async function daftar(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const q = req.query.q ? String(req.query.q).trim() : '';

  const where = [];
  const params = [];
  if (req.query.status) {
    where.push('k.status = ?');
    params.push(req.query.status);
  }
  if (req.query.dari) {
    where.push('k.tanggal >= ?');
    params.push(req.query.dari);
  }
  if (req.query.sampai) {
    where.push('k.tanggal <= ?');
    params.push(req.query.sampai);
  }
  if (q) {
    // Cari di nama tahanan, atau nama/NIK salah satu pembesuk di kunjungan itu
    where.push(`(t.nama LIKE ? OR EXISTS (
      SELECT 1 FROM detail_kunjungan d2
      JOIN pembesuk p ON p.id = d2.pembesuk_id
      WHERE d2.kunjungan_id = k.id AND (p.nama LIKE ? OR p.nik LIKE ?)
    ))`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM kunjungan k
       JOIN tahanan t ON t.id = k.tahanan_id
       ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT k.id, k.no_urut, DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal, k.status,
              t.nama AS tahanan_nama, t.status_verifikasi AS tahanan_status_verifikasi,
              (SELECT COUNT(*) FROM detail_kunjungan d WHERE d.kunjungan_id = k.id) AS jumlah_pembesuk,
              k.dibuat_pada
       FROM kunjungan k
       JOIN tahanan t ON t.id = k.tahanan_id
       ${whereSql}
       ORDER BY k.dibuat_pada DESC, k.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, page, limit, total });
  } catch (err) {
    serverError(res, err);
  }
}

// GET /api/kunjungan/:id
export async function detail(req, res) {
  const id = Number(req.params.id);
  try {
    const [rows] = await pool.query(
      `SELECT k.id, k.no_urut, DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal, k.status,
              k.alasan_penolakan, k.setuju_peraturan, k.waktu_setuju,
              k.diproses_pada, k.dibuat_pada,
              t.id AS tahanan_id, t.nama AS tahanan_nama,
              t.status_verifikasi AS tahanan_status_verifikasi,
              pr.nama AS diproses_oleh, pd.nama AS didaftarkan_oleh
       FROM kunjungan k
       JOIN tahanan t ON t.id = k.tahanan_id
       LEFT JOIN pengguna pr ON pr.id = k.diproses_oleh
       LEFT JOIN pengguna pd ON pd.id = k.didaftarkan_oleh
       WHERE k.id = ?`,
      [id]
    );
    const k = rows[0];
    if (!k) return tidakDitemukan(res);

    const [pembesuk] = await pool.query(
      `SELECT d.id AS detail_id, p.id AS pembesuk_id, p.nik, p.nama, p.alamat, p.no_hp,
              d.hubungan, (p.foto_ktp IS NOT NULL) AS punya_foto_ktp
       FROM detail_kunjungan d
       JOIN pembesuk p ON p.id = d.pembesuk_id
       WHERE d.kunjungan_id = ?
       ORDER BY d.id`,
      [id]
    );

    res.json({
      kunjungan: {
        id: k.id,
        no_urut: k.no_urut,
        tanggal: k.tanggal,
        status: k.status,
        alasan_penolakan: k.alasan_penolakan,
        setuju_peraturan: Boolean(k.setuju_peraturan),
        waktu_setuju: k.waktu_setuju,
        diproses_oleh: k.diproses_oleh,
        diproses_pada: k.diproses_pada,
        didaftarkan_oleh: k.didaftarkan_oleh,
        dibuat_pada: k.dibuat_pada,
        tahanan: {
          id: k.tahanan_id,
          nama: k.tahanan_nama,
          status_verifikasi: k.tahanan_status_verifikasi,
        },
      },
      pembesuk: pembesuk.map((p) => ({ ...p, punya_foto_ktp: Boolean(p.punya_foto_ktp) })),
    });
  } catch (err) {
    serverError(res, err);
  }
}