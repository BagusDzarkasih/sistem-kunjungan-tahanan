import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { pengaturanRules } from '../validators/pengaturan.validator.js';
import { ambil, ubah } from '../controllers/pengaturan.controller.js';

const router = Router();

// Khusus admin. Peran dicek sebelum validasi, jadi petugas selalu mendapat 403 DILARANG.
router.use(verifyToken, requireRole('admin'));

router.get('/', ambil);
router.put('/', pengaturanRules, validate, ubah);

export default router;