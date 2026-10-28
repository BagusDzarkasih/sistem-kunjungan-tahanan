import pool from '../config/db.js';
import { bacaPengaturan } from './pengaturan.js';

// Ubah kunjungan 'menunggu' yang terlalu lama menjadi 'kedaluwarsa'.
// diproses_oleh dan diproses_pada dibiarkan kosong karena tidak ada petugas yang memprosesnya.
// Setujui dan tolak memakai UPDATE ... WHERE status = 'menunggu', jadi kalau petugas dan job
// bersamaan, yang pertama menang dan yang kedua mendapat 409 SUDAH_DIPROSES.
export async function kedaluwarsakan() {
  const { kedaluwarsa_jam } = await bacaPengaturan(); // dibaca tiap putaran, perubahan langsung berlaku
  const [hasil] = await pool.query(
    `UPDATE kunjungan
     SET status = 'kedaluwarsa'
     WHERE status = 'menunggu' AND dibuat_pada < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
    [kedaluwarsa_jam]
  );
  return hasil.affectedRows;
}

// Dijalankan dari server.js: sekali saat server menyala, lalu berulang
export function jalankanKedaluwarsa() {
  const menit = Number(process.env.KEDALUWARSA_CEK_MENIT) || 10;

  const putaran = async () => {
    try {
      const jumlah = await kedaluwarsakan();
      if (jumlah > 0) {
        console.log(`[kedaluwarsa] ${jumlah} kunjungan diubah menjadi kedaluwarsa`);
      }
    } catch (err) {
      console.error('[kedaluwarsa] gagal:', err);
    }
  };

  putaran();
  const timer = setInterval(putaran, menit * 60 * 1000);
  timer.unref(); // timer tidak menahan proses saat server dimatikan
  return timer;
}