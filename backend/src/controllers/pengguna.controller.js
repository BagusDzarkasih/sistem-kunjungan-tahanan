import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

// Kolom aktif di MySQL berupa 1 atau 0, di sini diubah menjadi true atau false.
// password_hash tidak pernah ikut dipilih atau dikirim.
const KOLOM = 'id, nama, username, role, aktif, dibuat_pada';
const rapikan = (p) => ({ ...p, aktif: Boolean(p.aktif) });

export async function daftar(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const q = req.query.q ? String(req.query.q).trim() : '';
  const { role, aktif } = req.query;

  const where = [];
  const params = [];
  if (q) {
    where.push('(nama LIKE ? OR username LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  if (aktif) {
    where.push('aktif = ?');
    params.push(aktif === 'true' ? 1 : 0);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM pengguna ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT ${KOLOM}
       FROM pengguna ${whereSql}
       ORDER BY dibuat_pada DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows.map(rapikan), page, limit, total });
  } catch (err) {
    serverError(res, err);
  }
}

export async function tambah(req, res) {
  const { nama, username, password, role } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const [hasil] = await pool.query(
      'INSERT INTO pengguna (nama, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [nama, username, hash, role]
    );
    const [rows] = await pool.query(
      `SELECT ${KOLOM} FROM pengguna WHERE id = ?`,
      [hasil.insertId]
    );
    res.status(201).json({ pengguna: rapikan(rows[0]) });
  } catch (err) {
    // Kolom username UNIQUE, jadi database sendiri yang menolak username kembar
    // (tanpa celah dua permintaan bersamaan lolos pengecekan).
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        kode: 'USERNAME_SUDAH_DIPAKAI',
        pesan: 'Username sudah dipakai akun lain',
      });
    }
    serverError(res, err);
  }
}