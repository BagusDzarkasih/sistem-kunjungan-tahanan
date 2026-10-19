import multer from 'multer';

const MAKS_UKURAN = 2 * 1024 * 1024; // 2 MB per file

const kirimError = (res, status, kode, pesan) => res.status(status).json({ kode, pesan });

// ---------- Ganti foto KTP (satu file, field foto_ktp) ----------
const unggah = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAKS_UKURAN, files: 1 },
}).single('foto_ktp');

export function unggahFotoKtp(req, res, next) {
  unggah(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return kirimError(res, 400, 'FILE_TERLALU_BESAR', 'Ukuran foto maksimal 2 MB');
      }
      return kirimError(res, 400, 'FILE_TIDAK_VALID', 'Kirim satu file pada field foto_ktp');
    }

    console.error(err);
    return kirimError(res, 500, 'SERVER_ERROR', 'Terjadi kesalahan pada server');
  });
}

// ---------- Pendaftaran kunjungan (banyak file: foto_pembesuk_N dan foto_ktp_N) ----------
// Maksimal 20 pembesuk x 2 foto = 40 file. Nama field dicek di controller.
const unggahBanyak = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAKS_UKURAN,
    files: 40,
    fields: 5, // field teks (hanya "data" yang dipakai)
    fieldSize: 256 * 1024, // ukuran field "data" maksimal 256 KB
  },
}).any();

export function unggahFotoKunjungan(req, res, next) {
  unggahBanyak(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return kirimError(res, 400, 'FILE_TERLALU_BESAR', 'Ukuran setiap foto maksimal 2 MB');
        case 'LIMIT_FILE_COUNT':
          return kirimError(res, 400, 'FILE_TIDAK_VALID', 'Maksimal 40 file (20 pembesuk)');
        case 'LIMIT_FIELD_COUNT':
        case 'LIMIT_FIELD_VALUE':
        case 'LIMIT_FIELD_KEY':
          return kirimError(res, 400, 'INPUT_TIDAK_VALID', 'Field teks terlalu banyak atau terlalu besar');
        default:
          return kirimError(res, 400, 'FILE_TIDAK_VALID', 'File yang dikirim tidak valid');
      }
    }

    console.error(err);
    return kirimError(res, 500, 'SERVER_ERROR', 'Terjadi kesalahan pada server');
  });
}