import pool from '../config/db.js';
import { deteksiJenis, simpanFoto, hapusFoto } from '../utils/foto.js';

const POLA_FILE = /^foto_(pembesuk|ktp)_(\d+)$/;
const MAKS_PERCOBAAN = 3;

// Error yang sudah punya status dan kode sendiri, supaya bisa dilempar dari mana saja
class GalatInput extends Error {
  constructor(status, kode, pesan, errors) {
    super(pesan);
    this.status = status;
    this.kode = kode;
    this.errors = errors;
  }
}

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

// Mengelompokkan file berdasarkan nama field dan memeriksa isinya (JPG atau PNG).
function petakanFile(files, jumlahPembesuk) {
  const berkas = { pembesuk: new Map(), ktp: new Map() };

  for (const f of files || []) {
    const cocok = POLA_FILE.exec(f.fieldname);
    if (!cocok) {
      throw new GalatInput(
        400,
        'FILE_TIDAK_VALID',
        `Nama field file tidak dikenal: ${String(f.fieldname).slice(0, 50)}`
      );
    }

    const jenis = cocok[1];
    const indeks = Number(cocok[2]);

    if (indeks >= jumlahPembesuk) {
      throw new GalatInput(400, 'FILE_TIDAK_VALID', `Indeks file melebihi jumlah pembesuk: ${f.fieldname}`);
    }
    if (berkas[jenis].has(indeks)) {
      throw new GalatInput(400, 'FILE_TIDAK_VALID', `File dobel untuk field ${f.fieldname}`);
    }

    const ekstensi = deteksiJenis(f.buffer);
    if (!ekstensi) {
      throw new GalatInput(400, 'FILE_TIDAK_VALID', `Hanya file JPG atau PNG yang diterima (${f.fieldname})`);
    }

    berkas[jenis].set(indeks, { buffer: f.buffer, ekstensi });
  }

  return berkas;
}

// Satu kali percobaan menyimpan seluruh kunjungan di dalam satu transaksi.
// Kalau gagal di tengah jalan: database di-rollback dan semua file yang sudah
// tertulis dihapus lagi.
async function simpanKunjungan(data, berkas) {
  const koneksi = await pool.getConnection();
  const tersimpan = [];

  const simpan = async (subfolder, f) => {
    const path = await simpanFoto(subfolder, f.buffer, f.ekstensi);
    tersimpan.push(path);
    return path;
  };

  try {
    await koneksi.beginTransaction();

    // 1. Pembesuk mana yang sudah terdaftar?
    const [ada] = await koneksi.query(
      'SELECT id, nik, foto_ktp FROM pembesuk WHERE nik IN (?)',
      [data.pembesuk.map((p) => p.nik)]
    );
    const pembesukAda = new Map(ada.map((r) => [r.nik, r]));

    // 2. Kelengkapan data: foto pembesuk wajib untuk semua, data identitas dan
    //    foto KTP wajib hanya untuk pembesuk baru.
    const errors = [];
    data.pembesuk.forEach((p, i) => {
      if (!berkas.pembesuk.has(i)) {
        errors.push({ field: `foto_pembesuk_${i}`, pesan: 'Foto pembesuk wajib diunggah' });
      }
      if (!pembesukAda.has(p.nik)) {
        ['nama', 'alamat', 'no_hp'].forEach((kolom) => {
          if (!p[kolom]) {
            errors.push({
              field: `data.pembesuk[${i}].${kolom}`,
              pesan: `${kolom} wajib diisi untuk pembesuk baru`,
            });
          }
        });
        if (!berkas.ktp.has(i)) {
          errors.push({ field: `foto_ktp_${i}`, pesan: 'Foto KTP wajib untuk pembesuk baru' });
        }
      }
    });
    if (errors.length > 0) {
      throw new GalatInput(400, 'INPUT_TIDAK_VALID', 'Data yang dikirim tidak valid', errors);
    }

    // 3. Tahanan: tautkan kalau namanya cocok dengan TEPAT SATU tahanan
    //    (collation utf8mb4_unicode_ci tidak membedakan huruf besar kecil).
    //    Selain itu buat tahanan baru berstatus "belum" untuk diperiksa petugas.
    const [cocok] = await koneksi.query('SELECT id FROM tahanan WHERE nama = ? LIMIT 2', [
      data.tahanan_nama_baru,
    ]);
    let tahananId;
    if (cocok.length === 1) {
      tahananId = cocok[0].id;
    } else {
      const [baru] = await koneksi.query(
        "INSERT INTO tahanan (nama, status_verifikasi) VALUES (?, 'belum')",
        [data.tahanan_nama_baru]
      );
      tahananId = baru.insertId;
    }

    // 4. Nomor registrasi. Jaminan utamanya adalah UNIQUE pada kunjungan.no_urut:
    //    kalau dua pendaftar mendapat nomor sama, salah satu gagal (ER_DUP_ENTRY)
    //    dan diulang oleh pemanggil.
    const [[{ berikut }]] = await koneksi.query(
      'SELECT COALESCE(MAX(no_urut), 0) + 1 AS berikut FROM kunjungan FOR UPDATE'
    );

    // 5. Kunjungan. status bawaan "menunggu", didaftarkan_oleh kosong (diisi pembesuk sendiri).
    const [kunjungan] = await koneksi.query(
      `INSERT INTO kunjungan (no_urut, tahanan_id, tanggal, setuju_peraturan, waktu_setuju)
       VALUES (?, ?, CURDATE(), 1, NOW())`,
      [berikut, tahananId]
    );

    // 6. Pembesuk dan detail kunjungan
    for (let i = 0; i < data.pembesuk.length; i += 1) {
      const p = data.pembesuk[i];
      const lama = pembesukAda.get(p.nik);
      let pembesukId;

      if (lama) {
        // Pembesuk lama: data identitas dari klien diabaikan. Satu-satunya yang
        // boleh masuk adalah foto KTP kalau datanya belum punya.
        pembesukId = lama.id;
        if (!lama.foto_ktp && berkas.ktp.has(i)) {
          const pathKtp = await simpan('ktp', berkas.ktp.get(i));
          await koneksi.query('UPDATE pembesuk SET foto_ktp = ? WHERE id = ?', [pathKtp, lama.id]);
        }
      } else {
        const pathKtp = await simpan('ktp', berkas.ktp.get(i));
        const [baru] = await koneksi.query(
          'INSERT INTO pembesuk (nik, nama, alamat, no_hp, foto_ktp) VALUES (?, ?, ?, ?, ?)',
          [p.nik, p.nama, p.alamat, p.no_hp, pathKtp]
        );
        pembesukId = baru.insertId;
      }

      const pathFoto = await simpan('pembesuk', berkas.pembesuk.get(i));
      await koneksi.query(
        `INSERT INTO detail_kunjungan (kunjungan_id, pembesuk_id, hubungan, foto_pembesuk)
         VALUES (?, ?, ?, ?)`,
        [kunjungan.insertId, pembesukId, p.hubungan, pathFoto]
      );
    }

    await koneksi.commit();
    return berikut;
  } catch (err) {
    await koneksi.rollback().catch(() => {});
    await Promise.all(tersimpan.map((path) => hapusFoto(path)));
    throw err;
  } finally {
    koneksi.release();
  }
}

// POST /api/kunjungan (publik)
export async function buat(req, res) {
  const { data } = req.body;

  try {
    const berkas = petakanFile(req.files, data.pembesuk.length);

    for (let percobaan = 1; ; percobaan += 1) {
      try {
        const noUrut = await simpanKunjungan(data, berkas);
        return res.status(201).json({ no_urut: noUrut, status: 'menunggu' });
      } catch (err) {
        const bisaDiulang =
          ['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK'].includes(err.code) && percobaan < MAKS_PERCOBAAN;
        if (!bisaDiulang) throw err;
      }
    }
  } catch (err) {
    if (err instanceof GalatInput) {
      return res.status(err.status).json({
        kode: err.kode,
        pesan: err.pesan,
        ...(err.errors ? { errors: err.errors } : {}),
      });
    }
    if (err.code === 'ER_DUP_ENTRY' || err.code === 'ER_LOCK_DEADLOCK') {
      return res
        .status(409)
        .json({ kode: 'BENTROK', pesan: 'Terjadi bentrok data, silakan kirim ulang' });
    }
    return serverError(res, err);
  }
}