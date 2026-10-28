import { body } from 'express-validator';

// Harus angka bulat sungguhan (bukan teks "24"), dalam rentang yang diizinkan.
const bulatRule = (field, min, max) =>
  body(field)
    .custom((nilai) => Number.isInteger(nilai))
    .withMessage(`${field} wajib berupa bilangan bulat (angka, bukan teks)`)
    .bail()
    .custom((nilai) => nilai >= min && nilai <= max)
    .withMessage(`${field} antara ${min} sampai ${max}`);

export const pengaturanRules = [
  bulatRule('kedaluwarsa_jam', 1, 720),
  bulatRule('masa_simpan_foto_bulan', 3, 120),
];