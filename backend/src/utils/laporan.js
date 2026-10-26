import pool from '../config/db.js';

const dua = (n) => String(n).padStart(2, '0');

// '2026-10' -> { dari: '2026-10-01', sampai: '2026-10-31', jumlahHari: 31 }
export function hitungPeriode(bulan) {
  const [tahun, bln] = bulan.split('-').map(Number);
  // Hari ke-0 pada bulan berikutnya = hari terakhir bulan ini
  const jumlahHari = new Date(tahun, bln, 0).getDate();
  return { dari: `${bulan}-01`, sampai: `${bulan}-${dua(jumlahHari)}`, jumlahHari };
}

// Rekap satu bulan. Dipakai oleh endpoint JSON (tahap A) dan ekspor (tahap B).
// Hanya kunjungan berstatus 'disetujui' yang dihitung sebagai kunjungan, jumlah per status
// tetap ditampilkan di ringkasan. Bulan ditentukan dari tanggal besuk (kunjungan.tanggal).
export async function ambilLaporan(bulan) {
  const { dari, sampai, jumlahHari } = hitungPeriode(bulan);
  const rentang = [dari, sampai];

  const [[perStatus], [[{ totalPembesuk }]], [perHari], [perTahanan], [rincianRows]] =
    await Promise.all([
      pool.query(
        `SELECT status, COUNT(*) AS jumlah
         FROM kunjungan
         WHERE tanggal BETWEEN ? AND ?
         GROUP BY status`,
        rentang
      ),
      pool.query(
        `SELECT COUNT(*) AS totalPembesuk
         FROM detail_kunjungan d
         JOIN kunjungan k ON k.id = d.kunjungan_id
         WHERE k.status = 'disetujui' AND k.tanggal BETWEEN ? AND ?`,
        rentang
      ),
      pool.query(
        `SELECT DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal,
                COUNT(DISTINCT k.id) AS jumlah_kunjungan,
                COUNT(d.id) AS jumlah_pembesuk
         FROM kunjungan k
         LEFT JOIN detail_kunjungan d ON d.kunjungan_id = k.id
         WHERE k.status = 'disetujui' AND k.tanggal BETWEEN ? AND ?
         GROUP BY k.tanggal`,
        rentang
      ),
      pool.query(
        `SELECT t.id AS tahanan_id, t.nama AS tahanan_nama,
                COUNT(DISTINCT k.id) AS jumlah_kunjungan,
                COUNT(d.id) AS jumlah_pembesuk
         FROM kunjungan k
         JOIN tahanan t ON t.id = k.tahanan_id
         LEFT JOIN detail_kunjungan d ON d.kunjungan_id = k.id
         WHERE k.status = 'disetujui' AND k.tanggal BETWEEN ? AND ?
         GROUP BY t.id, t.nama
         ORDER BY jumlah_kunjungan DESC, t.nama ASC`,
        rentang
      ),
      pool.query(
        `SELECT k.id, k.no_urut, DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal,
                t.nama AS tahanan_nama
         FROM kunjungan k
         JOIN tahanan t ON t.id = k.tahanan_id
         WHERE k.status = 'disetujui' AND k.tanggal BETWEEN ? AND ?
         ORDER BY k.tanggal ASC, k.no_urut ASC`,
        rentang
      ),
    ]);

  // Ringkasan: semua status mulai dari 0
  const ringkasan = { disetujui: 0, ditolak: 0, menunggu: 0, kedaluwarsa: 0 };
  for (const baris of perStatus) ringkasan[baris.status] = baris.jumlah;

  // Per hari: semua tanggal di bulan itu, hari tanpa kunjungan bernilai 0
  const petaHari = new Map(perHari.map((h) => [h.tanggal, h]));
  const per_hari = [];
  for (let i = 1; i <= jumlahHari; i += 1) {
    const tanggal = `${bulan}-${dua(i)}`;
    const data = petaHari.get(tanggal);
    per_hari.push({
      tanggal,
      jumlah_kunjungan: data ? data.jumlah_kunjungan : 0,
      jumlah_pembesuk: data ? data.jumlah_pembesuk : 0,
    });
  }

  // Rincian: nama dan hubungan pembesuk saja (tanpa NIK, alamat, atau nomor HP)
  const petaPembesuk = new Map();
  if (rincianRows.length > 0) {
    const [pembesukRows] = await pool.query(
      `SELECT d.kunjungan_id, p.nama, d.hubungan
       FROM detail_kunjungan d
       JOIN pembesuk p ON p.id = d.pembesuk_id
       WHERE d.kunjungan_id IN (?)
       ORDER BY d.id`,
      [rincianRows.map((r) => r.id)]
    );
    for (const p of pembesukRows) {
      if (!petaPembesuk.has(p.kunjungan_id)) petaPembesuk.set(p.kunjungan_id, []);
      petaPembesuk.get(p.kunjungan_id).push({ nama: p.nama, hubungan: p.hubungan });
    }
  }
  const rincian = rincianRows.map((r) => ({
    no_urut: r.no_urut,
    tanggal: r.tanggal,
    tahanan_nama: r.tahanan_nama,
    pembesuk: petaPembesuk.get(r.id) || [],
  }));

  return {
    periode: { bulan, dari, sampai },
    ringkasan: {
      total_kunjungan: ringkasan.disetujui,
      total_pembesuk: totalPembesuk,
      ...ringkasan,
    },
    per_hari,
    per_tahanan: perTahanan,
    rincian,
  };
}