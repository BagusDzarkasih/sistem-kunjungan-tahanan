import fs from 'node:fs/promises';
import pool from '../config/db.js';
import { lokasiFoto } from './foto.js';
import { bacaPengaturan } from './pengaturan.js';

const UKURAN_BATCH = 200; // foto per putaran
const MAKS_PUTARAN = 50; // batas pengaman per kali jalan

// Hapus file; file yang sudah tidak ada dianggap berhasil, error lain dilempar
// supaya foto yang gagal dihapus tidak ditandai terhapus di database.
async function hapusFile(pathRelatif) {
  const lokasi = lokasiFoto(pathRelatif);
  if (!lokasi) return; // path tidak valid: tidak ada file yang bisa dihapus
  try {
    await fs.unlink(lokasi);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

// Hapus foto pembesuk milik kunjungan yang lebih tua dari masa_simpan_foto_bulan.
// Foto KTP tidak disentuh. Setelah file dihapus, kolom foto_pembesuk diisi '' sebagai penanda
// (kolomnya NOT NULL). Urutan: file dulu, baru database, jadi kalau berhenti di tengah,
// putaran berikutnya melanjutkan tanpa file yatim.
export async function hapusFotoLama() {
  const { masa_simpan_foto_bulan } = await bacaPengaturan();
  let terakhirId = 0;
  let berhasil = 0;
  let gagal = 0;

  for (let putaran = 0; putaran < MAKS_PUTARAN; putaran += 1) {
    const [rows] = await pool.query(
      `SELECT d.id, d.foto_pembesuk
       FROM detail_kunjungan d
       JOIN kunjungan k ON k.id = d.kunjungan_id
       WHERE k.tanggal < DATE_SUB(CURDATE(), INTERVAL ? MONTH)
         AND d.foto_pembesuk <> ''
         AND d.id > ?
       ORDER BY d.id
       LIMIT ?`,
      [masa_simpan_foto_bulan, terakhirId, UKURAN_BATCH]
    );
    if (rows.length === 0) break;

    for (const baris of rows) {
      terakhirId = baris.id;
      try {
        await hapusFile(baris.foto_pembesuk);
        await pool.query("UPDATE detail_kunjungan SET foto_pembesuk = '' WHERE id = ?", [baris.id]);
        berhasil += 1;
      } catch (err) {
        gagal += 1;
        console.error(`[foto] gagal menghapus detail_kunjungan ${baris.id}:`, err);
      }
    }
    if (rows.length < UKURAN_BATCH) break;
  }

  return { berhasil, gagal };
}

// Dijalankan dari server.js: sekali saat server menyala, lalu tiap FOTO_BERSIH_JAM jam
export function jalankanHapusFotoLama() {
  const jam = Math.min(Number(process.env.FOTO_BERSIH_JAM) || 24, 168);

  const putaran = async () => {
    try {
      const { berhasil, gagal } = await hapusFotoLama();
      if (berhasil > 0) console.log(`[foto] ${berhasil} foto pembesuk lama dihapus`);
      if (gagal > 0) console.log(`[foto] ${gagal} foto gagal dihapus, dicoba lagi di putaran berikutnya`);
    } catch (err) {
      console.error('[foto] gagal:', err);
    }
  };

  putaran();
  const timer = setInterval(putaran, jam * 60 * 60 * 1000);
  timer.unref();
  return timer;
}