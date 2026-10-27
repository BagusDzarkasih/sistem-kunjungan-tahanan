import { Router } from 'express';
import { ambil, ubah } from '../controllers/peraturan.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js'; // samakan dengan import di pengguna.routes.js
import { peraturanRules } from '../validators/peraturan.validator.js';

const router = Router();

// PUBLIK: tanpa login dan tanpa pembatas request (hanya membaca satu baris kecil)
router.get('/', ambil);

// WAJIB LOGIN: admin dan petugas boleh mengubah teks peraturan
router.put('/', verifyToken, requireRole('admin', 'petugas'), peraturanRules, validate, ubah);

export default router;