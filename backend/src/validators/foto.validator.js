import { param } from 'express-validator';

export const fotoRules = [
  param('jenis').isIn(['ktp', 'pembesuk']).withMessage('jenis harus ktp atau pembesuk'),
  param('id').isInt({ min: 1 }).withMessage('ID tidak valid'),
];