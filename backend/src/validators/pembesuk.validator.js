import { body, param, query } from 'express-validator';

export const idRules = [
  param('id').isInt({ min: 1 }).withMessage('ID tidak valid'),
];

export const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page minimal 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit antara 1 sampai 100'),
  query('q').optional().isString().isLength({ max: 100 }).withMessage('q maksimal 100 karakter'),
];

export const cekNikRules = [
  body('nik')
    .isString().withMessage('NIK harus berupa teks').bail()
    .trim()
    .matches(/^\d{16}$/).withMessage('NIK harus 16 digit angka'),
];

export const pembesukRules = [
  body('nik')
    .isString().withMessage('NIK harus berupa teks').bail()
    .trim()
    .matches(/^\d{16}$/).withMessage('NIK harus 16 digit angka'),
  body('nama')
    .isString().withMessage('Nama harus berupa teks').bail()
    .trim()
    .notEmpty().withMessage('Nama wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama 3 sampai 100 karakter'),
  body('alamat')
    .isString().withMessage('Alamat harus berupa teks').bail()
    .trim()
    .notEmpty().withMessage('Alamat wajib diisi')
    .isLength({ min: 5, max: 500 }).withMessage('Alamat 5 sampai 500 karakter'),
  body('no_hp')
    .isString().withMessage('No HP harus berupa teks').bail()
    .trim()
    .customSanitizer((v) => v.replace(/[\s-]/g, ''))
    .matches(/^\+?\d{8,15}$/).withMessage('No HP harus 8 sampai 15 digit angka'),
];