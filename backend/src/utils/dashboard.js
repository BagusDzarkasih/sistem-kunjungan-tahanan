import pool from '../config/db.js';

// "Hari ini" dan "bulan ini" ditentukan MySQL (CURDATE), sama seperti kolom kunjungan.tanggal
// yang diisi CURDATE() saat pendaftaran, jadi tidak mungkin berbeda zona waktu.
const AWAL_BULAN = "DATE_FORMAT(CURDATE(), '%Y-%m-01')";

// Jumlah per status, semua status mulai dari 0
function hitungStatus(baris) {
  const hasil = { disetujui: 0, ditolak: 0, menunggu: 0, kedaluwarsa: 0 };
  for (const b of baris) hasil[b.status] = b.jumlah;
  return hasil;
}

// Angka-angka dashboard. Aturan hitung bulan_ini sama dengan laporan bulanan:
// hanya kunjungan berstatus 'disetujui' yang dihitung sebagai kunjungan dan pembesuk.
export async function ambilAngka() {
  const [[[waktu]], [hariIni], [[{ perluDiproses }]], [[{ belumDiverifikasi }]], [bulanIni], [[{ totalPembesuk }]]] =
    await Promise.all([
      pool.query(
        `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS tanggal,
                DATE_FORMAT(CURDATE(), '%Y-%m') AS bulan`
      ),
      pool.query(
        `SELECT status, COUNT(*) AS jumlah
         FROM kunjungan
         WHERE tanggal = CURDATE()
         GROUP BY status`
      ),
      // Semua yang menunggu, tanpa memandang tanggal
      pool.query(`SELECT COUNT(*) AS perluDiproses FROM kunjungan WHERE status = 'menunggu'`),
      pool.query(`SELECT COUNT(*) AS belumDiverifikasi FROM tahanan WHERE status_verifikasi = 'belum'`),
      pool.query(
        `SELECT status, COUNT(*) AS jumlah
         FROM kunjungan
         WHERE tanggal BETWEEN ${AWAL_BULAN} AND LAST_DAY(CURDATE())
         GROUP BY status`
      ),
      pool.query(
        `SELECT COUNT(*) AS totalPembesuk
         FROM detail_kunjungan d
         JOIN kunjungan k ON k.id = d.kunjungan_id
         WHERE k.status = 'disetujui'
           AND k.tanggal BETWEEN ${AWAL_BULAN} AND LAST_DAY(CURDATE())`
      ),
    ]);

  const statusBulan = hitungStatus(bulanIni);

  return {
    tanggal: waktu.tanggal,
    hari_ini: hitungStatus(hariIni),
    perlu_diproses: perluDiproses,
    tahanan_belum_diverifikasi: belumDiverifikasi,
    bulan_ini: {
      bulan: waktu.bulan,
      total_kunjungan: statusBulan.disetujui,
      total_pembesuk: totalPembesuk,
      ...statusBulan,
    },
  };
}