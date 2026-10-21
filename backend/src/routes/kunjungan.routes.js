import { Router } from 'express';
import validate from '../middleware/validate.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { batasKunjungan } from '../middleware/rateLimit.js';
import { unggahFotoKunjungan } from '../middleware/upload.js';
import { parseData, kunjunganRules } from '../validators/kunjungan.validator.js';
import { idRules, daftarRules } from '../validators/kunjunganPanel.validator.js';
import { buat } from '../controllers/kunjungan.controller.js';
import { daftar, detail } from '../controllers/kunjunganPanel.controller.js';

const router = Router();

// PUBLIK (form pembesuk). Urutan: batas request -> unggah -> parseData -> aturan -> validate -> controller.
// Pembatas ditaruh paling depan supaya foto tidak diproses kalau request sudah ditolak.
router.post('/', batasKunjungan, unggahFotoKunjungan, parseData, kunjunganRules, validate, buat);

// PETUGAS DAN ADMIN: semua rute di bawah baris ini wajib login.
router.use(verifyToken, requireRole('admin', 'petugas'));

router.get('/', daftarRules, validate, daftar);
router.get('/:id', idRules, validate, detail);
// Tahap B: PATCH /:id/setujui dan PATCH /:id/tolak ditambahkan di sini.

export default router;