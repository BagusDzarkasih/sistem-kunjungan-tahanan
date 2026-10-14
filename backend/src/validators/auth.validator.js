import { body } from 'express-validator';

export const loginRules = [
  body('username')
    .isString().withMessage('Username harus berupa teks')
    .trim()
    .notEmpty().withMessage('Username wajib diisi')
    .isLength({ max: 50 }).withMessage('Username maksimal 50 karakter'),
  body('password')
    .isString().withMessage('Password harus berupa teks')
    .notEmpty().withMessage('Password wajib diisi')
    .isLength({ max: 100 }).withMessage('Password maksimal 100 karakter'),
];