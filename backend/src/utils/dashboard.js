import pool from '../config/db.js';

export const HARI_BAWAAN = 14;

// "Hari ini" dan "bulan ini" ditentukan MySQL (CURDATE), sama seperti kolom kunjungan.tanggal
// yang diisi CURDATE() saat pendaftaran, jadi tidak mungkin berbeda zona waktu.
const AWAL_BULAN = "DATE_FORMAT(CURDATE(), '%Y-%m-01')";

// Jumlah per status, semua status mulai dari 0
function hitungStatus(baris) {
  const hasil = { disetujui: 0, ditolak: 0, menunggu: 0, kedaluwarsa: 0 };
  for (const b of baris) hasil[b.status] = b.jumlah;
  return hasil;
}

// Daftar tanggal dari (hari - 1) hari sebelum 'akhir' sampai 'akhir', urut dari yang terlama.
// Dihitung dengan UTC supaya tidak terpengaruh zona waktu server Node.
// '2026-10-28', 3 -> ['2026-10-26', '2026-10-27', '2026-10-28']
function daftarTanggal(akhir, hari) {
  const hasil = [];
  for (let i = hari - 1; i >= 0; i -= 1) {
    const t = new Date(`${akhir}T00:00:00Z`);
    t.setUTCDate(t.getUTCDate() - i);
    hasil.push(t.toISOString().slice(0, 10));
  }
  return hasil;
}

// Data dashboard. Aturan hitung bulan_ini dan per_hari sama dengan laporan bulanan:
// hanya kunjungan berstatus 'disetujui' yang dihitung sebagai kunjungan dan pembesuk.
export async function ambilDashboard(hari = HARI_BAWAAN) {
  const [
    [[waktu]],
    [hariIni],
    [[{ perluDiproses }]],
    [[{ belumDiverifikasi }]],
    [bulanIni],
    [[{ totalPembesuk }]],
    [perHari],
  ] = await Promise.all([
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
    pool.query(
      `SELECT DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal,
              COUNT(DISTINCT k.id) AS jumlah_kunjungan,
              COUNT(d.id) AS jumlah_pembesuk
       FROM kunjungan k
       LEFT JOIN detail_kunjungan d ON d.kunjungan_id = k.id
       WHERE k.status = 'disetujui'
         AND k.tanggal BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND CURDATE()
       GROUP BY k.tanggal`,
      [hari - 1]
    ),
  ]);

  const statusBulan = hitungStatus(bulanIni);

  // Per hari: semua tanggal dalam rentang, hari tanpa kunjungan bernilai 0
  const petaHari = new Map(perHari.map((h) => [h.tanggal, h]));
  const per_hari = daftarTanggal(waktu.tanggal, hari).map((tanggal) => {
    const data = petaHari.get(tanggal);
    return {
      tanggal,
      jumlah_kunjungan: data ? data.jumlah_kunjungan : 0,
      jumlah_pembesuk: data ? data.jumlah_pembesuk : 0,
    };
  });

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
    per_hari,
  };
}