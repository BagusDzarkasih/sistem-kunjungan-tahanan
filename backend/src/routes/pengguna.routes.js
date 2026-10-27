import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import {
  idRules, listRules, penggunaBaruRules, penggunaUbahRules, aktifRules, passwordBaruRules,
} from '../validators/pengguna.validator.js';
import {
  daftar, tambah, ubah, ubahAktif, resetPassword,
} from '../controllers/pengguna.controller.js';

const router = Router();

// Semua endpoint pengguna khusus admin. Dicek lebih dulu sebelum validasi,
// jadi petugas selalu mendapat 403 walaupun body-nya salah.
router.use(verifyToken, requireRole('admin'));

router.get('/', listRules, validate, daftar);
router.post('/', penggunaBaruRules, validate, tambah);
router.put('/:id', idRules, penggunaUbahRules, validate, ubah);
router.patch('/:id/aktif', idRules, aktifRules, validate, ubahAktif);
router.patch('/:id/password', idRules, passwordBaruRules, validate, resetPassword);

export default router;