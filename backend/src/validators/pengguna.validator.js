import { body, param, query } from 'express-validator';

const namaRule = body('nama')
  .isString().withMessage('Nama harus berupa teks')
  .trim()
  .notEmpty().withMessage('Nama wajib diisi')
  .isLength({ min: 3, max: 100 }).withMessage('Nama 3 sampai 100 karakter');

const roleRule = body('role')
  .isIn(['admin', 'petugas']).withMessage('Role harus admin atau petugas');

// Password tidak di-trim: spasi di ujung dianggap bagian dari password.
const passwordRule = (field) =>
  body(field)
    .isString().withMessage('Password harus berupa teks')
    .isLength({ min: 8, max: 100 }).withMessage('Password 8 sampai 100 karakter');

export const idRules = [
  param('id').isInt({ min: 1 }).withMessage('ID tidak valid'),
];

export const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page minimal 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit antara 1 sampai 100'),
  query('q').optional().isString().isLength({ max: 100 }).withMessage('q maksimal 100 karakter'),
  query('role').optional().isIn(['admin', 'petugas'])
    .withMessage('role harus admin atau petugas'),
  query('aktif').optional().isIn(['true', 'false'])
    .withMessage('aktif harus true atau false'),
];

export const penggunaBaruRules = [
  namaRule,
  body('username')
    .isString().withMessage('Username harus berupa teks')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('Username wajib diisi')
    .isLength({ min: 3, max: 50 }).withMessage('Username 3 sampai 50 karakter')
    .matches(/^[a-z0-9._-]+$/)
    .withMessage('Username hanya boleh huruf, angka, titik, garis bawah, dan strip'),
  passwordRule('password'),
  roleRule,
];

// Username tidak bisa diubah, jadi hanya nama dan role.
export const penggunaUbahRules = [namaRule, roleRule];

// Harus boolean sungguhan (true/false), bukan teks "true" atau angka 1.
export const aktifRules = [
  body('aktif')
    .custom((nilai) => typeof nilai === 'boolean')
    .withMessage('aktif harus true atau false'),
];

export const passwordBaruRules = [passwordRule('password_baru')];