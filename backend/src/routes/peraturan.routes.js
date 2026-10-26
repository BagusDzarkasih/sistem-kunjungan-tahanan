import { Router } from 'express';
import { ambil } from '../controllers/peraturan.controller.js';

const router = Router();

// PUBLIK: tanpa login dan tanpa pembatas request (hanya membaca satu baris kecil)
router.get('/', ambil);

export default router;