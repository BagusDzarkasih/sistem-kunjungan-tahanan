import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { listRules, penggunaBaruRules } from '../validators/pengguna.validator.js';
import { daftar, tambah } from '../controllers/pengguna.controller.js';

const router = Router();

// Semua endpoint pengguna khusus admin. Dicek lebih dulu sebelum validasi,
// jadi petugas selalu mendapat 403 walaupun body-nya salah.
router.use(verifyToken, requireRole('admin'));

router.get('/', listRules, validate, daftar);
router.post('/', penggunaBaruRules, validate, tambah);

export default router;