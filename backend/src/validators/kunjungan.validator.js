import { body } from 'express-validator';

// Field "data" dikirim sebagai teks JSON di dalam multipart. Ubah jadi objek dulu
// supaya bisa dicek oleh express-validator.
export function parseData(req, res, next) {
  let data = req.body?.data;

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return res.status(400).json({
        kode: 'INPUT_TIDAK_VALID',
        pesan: 'Data yang dikirim tidak valid',
        errors: [{ field: 'data', pesan: 'Field data harus berupa JSON yang valid' }],
      });
    }
  }

  req.body = { data };
  return next();
}

const noHpRapi = (v) => v.replace(/[\s-]/g, '');

export const kunjunganRules = [
  body('data').isObject().withMessage('Field data wajib berupa objek JSON'),

  body('data.tahanan_nama_baru')
    .isString().withMessage('Nama tahanan harus berupa teks').bail()
    .customSanitizer((v) => v.trim().replace(/\s+/g, ' '))
    .isLength({ min: 3, max: 100 }).withMessage('Nama tahanan 3 sampai 100 karakter'),

  body('data.setuju_peraturan')
    .custom((v) => v === true).withMessage('Peraturan besuk harus disetujui'),

  body('data.pembesuk')
    .isArray({ min: 1, max: 20 }).withMessage('Jumlah pembesuk 1 sampai 20 orang'),

  body('data.pembesuk.*').isObject().withMessage('Data pembesuk tidak valid'),

  body('data.pembesuk.*.nik')
    .isString().withMessage('NIK harus berupa teks').bail()
    .trim()
    .matches(/^\d{16}$/).withMessage('NIK harus 16 digit angka'),

  body('data.pembesuk.*.hubungan')
    .isString().withMessage('Hubungan harus berupa teks').bail()
    .trim()
    .notEmpty().withMessage('Hubungan wajib diisi')
    .isLength({ max: 50 }).withMessage('Hubungan maksimal 50 karakter'),

  // Tiga kolom di bawah wajib hanya untuk pembesuk baru (dicek di controller).
  // Untuk pembesuk lama, server mengabaikannya.
  body('data.pembesuk.*.nama')
    .optional({ checkFalsy: true })
    .isString().withMessage('Nama harus berupa teks').bail()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Nama 3 sampai 100 karakter'),

  body('data.pembesuk.*.alamat')
    .optional({ checkFalsy: true })
    .isString().withMessage('Alamat harus berupa teks').bail()
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Alamat 5 sampai 500 karakter'),

  body('data.pembesuk.*.no_hp')
    .optional({ checkFalsy: true })
    .isString().withMessage('No HP harus berupa teks').bail()
    .trim()
    .customSanitizer(noHpRapi)
    .matches(/^\+?\d{8,15}$/).withMessage('No HP harus 8 sampai 15 digit angka'),

  // NIK tidak boleh dobel dalam satu kunjungan
  body('data.pembesuk').custom((daftar) => {
    if (!Array.isArray(daftar)) return true;
    const nik = daftar.map((p) => String(p?.nik ?? '').trim());
    if (new Set(nik).size !== nik.length) {
      throw new Error('NIK tidak boleh dobel dalam satu kunjungan');
    }
    return true;
  }),
];