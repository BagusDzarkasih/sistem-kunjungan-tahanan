// Simpan sebagai: backend/src/routes/auth.routes.js
import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

// Route = daftar alamat dan fungsi yang melayaninya.
const router = Router();

// POST /api/auth/login  ("/api/auth" ditambahkan di app.js)
router.post('/login', login);

export default router;
