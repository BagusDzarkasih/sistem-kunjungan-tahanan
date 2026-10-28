import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { tampil } from '../controllers/dashboard.controller.js';

const router = Router();

// Petugas dan admin
router.use(verifyToken, requireRole('admin', 'petugas'));

router.get('/', tampil);

export default router;