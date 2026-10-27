import { body } from 'express-validator';

// Teks peraturan: baris baru di tengah dipertahankan (\r\n dijadikan \n),
// spasi di ujung dibuang. Batas 5000 karakter jauh di bawah batas kolom TEXT.
export const peraturanRules = [
  body('teks')
    .isString().withMessage('Teks peraturan harus berupa teks')
    .bail()
    .customSanitizer((nilai) => nilai.replace(/\r\n/g, '\n'))
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Teks peraturan 10 sampai 5000 karakter'),
];