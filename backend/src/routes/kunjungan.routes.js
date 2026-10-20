import { Router } from 'express';
import validate from '../middleware/validate.js';
import { batasKunjungan } from '../middleware/rateLimit.js';
import { unggahFotoKunjungan } from '../middleware/upload.js';
import { parseData, kunjunganRules } from '../validators/kunjungan.validator.js';
import { buat } from '../controllers/kunjungan.controller.js';

const router = Router();

// PUBLIK (form pembesuk). Urutan: batas request -> unggah -> parseData -> aturan -> validate -> controller.
// Pembatas ditaruh paling depan supaya foto tidak diproses kalau request sudah ditolak.
// Rute petugas (daftar, setujui, tolak) nanti ditambahkan di bawah router.use(verifyToken).
router.post('/', batasKunjungan, unggahFotoKunjungan, parseData, kunjunganRules, validate, buat);

export default router;