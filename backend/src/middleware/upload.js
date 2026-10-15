import multer from 'multer';

const unggah = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB
}).single('foto_ktp');

export function unggahFotoKtp(req, res, next) {
  unggah(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(400)
          .json({ kode: 'FILE_TERLALU_BESAR', pesan: 'Ukuran foto maksimal 2 MB' });
      }
      return res
        .status(400)
        .json({ kode: 'FILE_TIDAK_VALID', pesan: 'Kirim satu file pada field foto_ktp' });
    }

    console.error(err);
    return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
  });
}