// Simpan sebagai: backend/src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Middleware = "penjaga pintu". Ia berjalan SEBELUM controller.
// Kalau lolos, ia memanggil next() supaya permintaan diteruskan.
// Kalau tidak, ia membalas sendiri dan controller tidak pernah dijalankan.

// Penjaga 1: apakah pengirim membawa token yang sah?
export async function verifyToken(req, res, next) {
  // Token dikirim di header: Authorization: Bearer <token>
  const header = req.headers.authorization || '';
  const [skema, token] = header.split(' ');

  if (skema !== 'Bearer' || !token) {
    return res
      .status(401)
      .json({ kode: 'BELUM_LOGIN', pesan: 'Silakan login terlebih dahulu' });
  }

  try {
    // jwt.verify memeriksa tanda tangan dan masa berlaku. Kalau gagal, ia melempar error.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Cek lagi ke database: akun masih ada dan aktif? Role diambil dari database,
    // jadi kalau admin menonaktifkan akun atau mengubah role, efeknya langsung terasa.
    const [rows] = await pool.query(
      'SELECT id, role, aktif FROM pengguna WHERE id = ?',
      [payload.id]
    );
    const pengguna = rows[0];
    if (!pengguna || !pengguna.aktif) {
      throw new Error('Akun tidak ditemukan atau tidak aktif');
    }

    // Simpan data pengguna di req supaya controller berikutnya bisa memakainya.
    req.user = { id: pengguna.id, role: pengguna.role };
    next();
  } catch (err) {
    return res.status(401).json({
      kode: 'TOKEN_TIDAK_VALID',
      pesan: 'Sesi tidak valid atau sudah berakhir, silakan login lagi',
    });
  }
}

// Penjaga 2: apakah role pengguna diizinkan? Dipakai SETELAH verifyToken.
// Contoh: requireRole('admin')  atau  requireRole('admin', 'petugas')
export function requireRole(...rolesDiizinkan) {
  // Fungsi ini mengembalikan middleware yang sudah "mengingat" daftar role-nya.
  return (req, res, next) => {
    if (!req.user || !rolesDiizinkan.includes(req.user.role)) {
      return res
        .status(403)
        .json({ kode: 'DILARANG', pesan: 'Anda tidak punya hak untuk tindakan ini' });
    }
    next();
  };
}
