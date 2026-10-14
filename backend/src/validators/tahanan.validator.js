import { body, param, query } from 'express-validator';

export const idRules = [
  param('id').isInt({ min: 1 }).withMessage('ID tidak valid'),
];

export const cariRules = [
  query('q')
    .isString().withMessage('q harus berupa teks')
    .isLength({ min: 3, max: 100 }).withMessage('Ketik minimal 3 huruf'),
];

export const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page minimal 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit antara 1 sampai 100'),
  query('q').optional().isString().isLength({ max: 100 }).withMessage('q maksimal 100 karakter'),
  query('status').optional().isIn(['belum', 'terverifikasi'])
    .withMessage('status harus belum atau terverifikasi'),
];

export const tahananRules = [
  body('nama')
    .isString().withMessage('Nama harus berupa teks')
    .trim()
    .notEmpty().withMessage('Nama tahanan wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama 3 sampai 100 karakter'),
];