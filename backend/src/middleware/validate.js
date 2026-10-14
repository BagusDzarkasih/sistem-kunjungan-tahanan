import { validationResult } from 'express-validator';

export default function validate(req, res, next) {
  const hasil = validationResult(req);
  if (hasil.isEmpty()) return next();

  return res.status(400).json({
    kode: 'INPUT_TIDAK_VALID',
    pesan: 'Data yang dikirim tidak valid',
    errors: hasil.array().map((e) => ({ field: e.path, pesan: e.msg })),
  });
}