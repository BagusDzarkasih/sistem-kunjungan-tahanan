import { Router } from 'express';
import validate from '../middleware/validate.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { dashboardRules } from '../validators/dashboard.validator.js';
import { tampil } from '../controllers/dashboard.controller.js';

const router = Router();

// Petugas dan admin
router.use(verifyToken, requireRole('admin', 'petugas'));

router.get('/', dashboardRules, validate, tampil);

export default router;