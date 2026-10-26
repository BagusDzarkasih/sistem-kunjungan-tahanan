import { Router } from 'express';
import validate from '../middleware/validate.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { bulanRules } from '../validators/laporan.validator.js';
import { bulanan } from '../controllers/laporan.controller.js';

const router = Router();

// Petugas dan admin
router.use(verifyToken, requireRole('admin', 'petugas'));

router.get('/bulanan', bulanRules, validate, bulanan);
// Tahap B: GET /bulanan/export ditambahkan di sini.

export default router;