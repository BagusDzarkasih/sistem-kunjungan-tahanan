import { query } from 'express-validator';

export const dashboardRules = [
  query('hari')
    .optional()
    .custom((nilai) => !Array.isArray(nilai))
    .withMessage('hari tidak boleh dikirim lebih dari sekali')
    .bail()
    .isInt({ min: 7, max: 31 })
    .withMessage('hari antara 7 sampai 31'),
];