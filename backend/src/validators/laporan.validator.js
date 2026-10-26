import { query } from 'express-validator';

export const bulanRules = [
  query('bulan')
    .isString()
    .withMessage('bulan wajib diisi dengan format YYYY-MM, contoh 2026-10')
    .bail()
    .matches(/^20\d{2}-(0[1-9]|1[0-2])$/)
    .withMessage('bulan harus berformat YYYY-MM (tahun 2000 sampai 2099), contoh 2026-10'),
];