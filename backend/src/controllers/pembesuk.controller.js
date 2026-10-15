import pool from '../config/db.js';

const KOLOM = `id, nik, nama, alamat, no_hp,
  (foto_ktp IS NOT NULL) AS punya_foto_ktp, dibuat_pada`;

const rapikan = (r) => ({ ...r, punya_foto_ktp: Boolean(r.punya_foto_ktp) });

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

const tidakDitemukan = (res) =>
  res.status(404).json({ kode: 'TIDAK_DITEMUKAN', pesan: 'Data pembesuk tidak ditemukan' });

const nikSudahAda = (res) =>
  res.status(409).json({ kode: 'NIK_SUDAH_TERDAFTAR', pesan: 'NIK sudah terdaftar' });

const masihDipakai = (res) =>
  res.status(409).json({
    kode: 'MASIH_DIPAKAI',
    pesan: 'Pembesuk sudah punya kunjungan, tidak bisa dihapus',
  });

export async function daftar(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const q = req.query.q ? String(req.query.q).trim() : '';

  const whereSql = q ? 'WHERE (nama LIKE ? OR nik LIKE ?)' : '';
  const params = q ? [`%${q}%`, `%${q}%`] : [];

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM pembesuk ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT id, nik, nama, no_hp, (foto_ktp IS NOT NULL) AS punya_foto_ktp, dibuat_pada
       FROM pembesuk ${whereSql}
       ORDER BY dibuat_pada DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows.map(rapikan), page, limit, total });
  } catch (err) {
    serverError(res, err);
  }
}

export async function detail(req, res) {
  const id = Number(req.params.id);
  try {
    const [rows] = await pool.query(`SELECT ${KOLOM} FROM pembesuk WHERE id = ?`, [id]);
    if (!rows[0]) return tidakDitemukan(res);

    const [riwayat] = await pool.query(
      `SELECT k.id, k.no_urut, k.tanggal, k.status,
              t.nama AS tahanan_nama, d.hubungan
       FROM detail_kunjungan d
       JOIN kunjungan k ON k.id = d.kunjungan_id
       JOIN tahanan t ON t.id = k.tahanan_id
       WHERE d.pembesuk_id = ?
       ORDER BY k.tanggal DESC, k.id DESC`,
      [id]
    );
    res.json({ pembesuk: rapikan(rows[0]), riwayat });
  } catch (err) {
    serverError(res, err);
  }
}

export async function tambah(req, res) {
  const { nik, nama, alamat, no_hp } = req.body;
  try {
    const [hasil] = await pool.query(
      'INSERT INTO pembesuk (nik, nama, alamat, no_hp) VALUES (?, ?, ?, ?)',
      [nik, nama, alamat, no_hp]
    );
    const [rows] = await pool.query(`SELECT ${KOLOM} FROM pembesuk WHERE id = ?`, [hasil.insertId]);
    res.status(201).json({ pembesuk: rapikan(rows[0]) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return nikSudahAda(res);
    serverError(res, err);
  }
}

export async function ubah(req, res) {
  const id = Number(req.params.id);
  const { nik, nama, alamat, no_hp } = req.body;
  try {
    const [ada] = await pool.query('SELECT id FROM pembesuk WHERE id = ?', [id]);
    if (!ada[0]) return tidakDitemukan(res);

    await pool.query(
      'UPDATE pembesuk SET nik = ?, nama = ?, alamat = ?, no_hp = ? WHERE id = ?',
      [nik, nama, alamat, no_hp, id]
    );
    const [rows] = await pool.query(`SELECT ${KOLOM} FROM pembesuk WHERE id = ?`, [id]);
    res.json({ pembesuk: rapikan(rows[0]) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return nikSudahAda(res);
    serverError(res, err);
  }
}

export async function hapus(req, res) {
  const id = Number(req.params.id);
  try {
    const [ada] = await pool.query('SELECT id FROM pembesuk WHERE id = ?', [id]);
    if (!ada[0]) return tidakDitemukan(res);

    const [[{ jumlah }]] = await pool.query(
      'SELECT COUNT(*) AS jumlah FROM detail_kunjungan WHERE pembesuk_id = ?',
      [id]
    );
    if (jumlah > 0) return masihDipakai(res);

    await pool.query('DELETE FROM pembesuk WHERE id = ?', [id]);
    res.json({ pesan: 'Data pembesuk dihapus' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return masihDipakai(res);
    serverError(res, err);
  }
}