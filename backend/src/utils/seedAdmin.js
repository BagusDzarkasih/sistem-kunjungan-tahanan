// Simpan sebagai: backend/src/utils/seedAdmin.js
//
// Skrip ini membuat akun admin pertama. Dijalankan SEKALI dari terminal, bukan bagian dari server.
// Cara pakai (dari folder backend):
// node src/utils/seedAdmin.js <username> "<nama lengkap>" <password>
// Contoh:
// node src/utils/seedAdmin.js admin "Administrator" Admin12345
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

// process.argv berisi kata-kata yang diketik setelah "node namafile".
// Dua yang pertama adalah alamat node dan file ini, jadi kita ambil mulai dari yang ketiga.
const [username, nama, password] = process.argv.slice(2);

if (!username || !nama || !password) {
  console.log('Cara pakai: node src/utils/seedAdmin.js <username> "<nama lengkap>" <password>');
  process.exit(1);
}

if (password.length < 8) {
  console.log('Password minimal 8 karakter.');
  process.exit(1);
}

try {
  // Tanda tanya (?) diisi dari daftar di sebelahnya. Jangan pernah menyambung teks
  // pengguna langsung ke dalam perintah SQL, karena itu membuka celah SQL injection.
  const [ada] = await pool.query('SELECT id FROM pengguna WHERE username = ?', [username]);

  if (ada.length > 0) {
    console.log(`Username "${username}" sudah ada. Tidak ada yang diubah.`);
  } else {
    // Angka 10 = tingkat "kerja keras" pengacakan. Makin besar makin aman tetapi makin lambat.
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO pengguna (nama, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [nama, username, hash, 'admin']
    );
    console.log(`Akun admin "${username}" berhasil dibuat.`);
  }
} catch (err) {
  console.error('Gagal membuat admin:', err.message);
  process.exitCode = 1;
} finally {
  // Tutup koneksi database supaya skrip bisa berhenti.
  await pool.end();
}
