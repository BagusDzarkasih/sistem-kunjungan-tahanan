// Simpan sebagai: backend/src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Controller = fungsi yang berisi "isi pekerjaan" sebuah endpoint.
// req = permintaan yang masuk (berisi data dari pengguna), res = cara kita membalas.
export async function login(req, res) {
  const { username, password } = req.body;

  // 1. Pastikan dua isian ada. Kalau kosong -> 400 (permintaan salah)
  if (!username || !password) {
    return res
      .status(400)
      .json({ kode: 'INPUT_TIDAK_VALID', pesan: 'Username dan password wajib diisi' });
  }

  try {
    // 2. Cari pengguna berdasarkan username
    const [rows] = await pool.query(
      'SELECT id, nama, username, password_hash, role, aktif FROM pengguna WHERE username = ?',
      [username]
    );
    const pengguna = rows[0]; // undefined kalau username tidak ditemukan

    // 3. Bandingkan password yang diketik dengan hash di database
    const passwordBenar = pengguna
      ? await bcrypt.compare(password, pengguna.password_hash)
      : false;

    // 4. Username tidak ada, password salah, atau akun nonaktif -> pesan yang SAMA,
    //    supaya orang luar tidak bisa menebak username mana yang ada. 401 = tidak berhak.
    if (!pengguna || !passwordBenar || !pengguna.aktif) {
      return res
        .status(401)
        .json({ kode: 'LOGIN_GAGAL', pesan: 'Username atau password salah' });
    }

    // 5. Buat token: isinya id dan role, ditandatangani dengan JWT_SECRET, berlaku sesuai .env
    const token = jwt.sign(
      { id: pengguna.id, role: pengguna.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 6. Kirim token dan data pengguna. Jangan pernah mengirim password_hash.
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
