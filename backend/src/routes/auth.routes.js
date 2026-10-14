import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { loginRules } from '../validators/auth.validator.js';

const router = Router();

// Terbuka untuk siapa saja. Urutan: aturan -> validate -> controller
router.post('/login', loginRules, validate, login);

// Hanya untuk yang sudah login
router.get('/me', verifyToken, me);

export default router;