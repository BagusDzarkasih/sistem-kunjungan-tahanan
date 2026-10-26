import { Router } from 'express';
import validate from '../middleware/validate.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { bulanRules, eksporRules } from '../validators/laporan.validator.js';
import { bulanan, ekspor } from '../controllers/laporan.controller.js';

const router = Router();

// Petugas dan admin
router.use(verifyToken, requireRole('admin', 'petugas'));

router.get('/bulanan', bulanRules, validate, bulanan);
router.get('/bulanan/export', eksporRules, validate, ekspor);

export default router;