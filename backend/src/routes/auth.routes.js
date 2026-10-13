// Simpan sebagai: backend/src/routes/auth.routes.js  (GANTI isi file lama)
import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Terbuka untuk siapa saja
router.post('/login', login);

// Hanya untuk yang sudah login. Urutan penting: verifyToken dulu, baru me.
router.get('/me', verifyToken, me);


export default router;
