import { query, param, body } from 'express-validator';

const STATUS = ['menunggu', 'disetujui', 'ditolak', 'kedaluwarsa'];
const FORMAT_TANGGAL = { format: 'YYYY-MM-DD', strictMode: true };

export const idRules = [
  param('id').isInt({ min: 1 }).withMessage('id harus bilangan bulat positif'),
];

export const daftarRules = [
  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('page harus bilangan bulat minimal 1'),
  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('limit harus antara 1 sampai 100'),
  query('status')
    .optional({ checkFalsy: true })
    .isIn(STATUS)
    .withMessage(`status harus salah satu dari: ${STATUS.join(', ')}`),
  query('dari')
    .optional({ checkFalsy: true })
    .isDate(FORMAT_TANGGAL)
    .withMessage('dari harus berformat YYYY-MM-DD'),
  query('sampai')
    .optional({ checkFalsy: true })
    .isDate(FORMAT_TANGGAL)
    .withMessage('sampai harus berformat YYYY-MM-DD')
    .custom((nilai, { req }) => {
      // Format YYYY-MM-DD bisa dibandingkan langsung sebagai teks
      if (req.query.dari && nilai < req.query.dari) {
        throw new Error('sampai tidak boleh lebih awal dari dari');
      }
      return true;
    }),
  query('q')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('q maksimal 100 karakter'),
];

export const tolakRules = [
  body('alasan')
    .isString()
    .withMessage('alasan wajib berupa teks')
    .bail()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('alasan harus 3 sampai 255 karakter'),
];