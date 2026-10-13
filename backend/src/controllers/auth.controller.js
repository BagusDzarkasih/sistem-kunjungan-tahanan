// Simpan sebagai: backend/src/controllers/auth.controller.js  (GANTI isi file lama)
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ kode: 'INPUT_TIDAK_VALID', pesan: 'Username dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nama, username, password_hash, role, aktif FROM pengguna WHERE username = ?',
      [username]
    );
    const pengguna = rows[0];

    const passwordBenar = pengguna
      ? await bcrypt.compare(password, pengguna.password_hash)
      : false;

    if (!pengguna || !passwordBenar || !pengguna.aktif) {
      return res
        .status(401)
        .json({ kode: 'LOGIN_GAGAL', pesan: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: pengguna.id, role: pengguna.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      pengguna: {
        id: pengguna.id,
        nama: pengguna.nama,
        username: pengguna.username,
        role: pengguna.role,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
  }
}

// BARU. Mengembalikan data pengguna yang sedang login.
// req.user diisi oleh middleware verifyToken, jadi di sini kita sudah pasti tahu siapa pengirimnya.
export async function me(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nama, username, role FROM pengguna WHERE id = ?',
      [req.user.id]
    );
    res.json({ pengguna: rows[0] });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
  }
}
