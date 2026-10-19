import { Router } from 'express';
import validate from '../middleware/validate.js';
import { unggahFotoKunjungan } from '../middleware/upload.js';
import { parseData, kunjunganRules } from '../validators/kunjungan.validator.js';
import { buat } from '../controllers/kunjungan.controller.js';

const router = Router();

// PUBLIK (form pembesuk). Urutan: unggah -> parseData -> aturan -> validate -> controller.
// Rute petugas (daftar, setujui, tolak) nanti ditambahkan di bawah router.use(verifyToken).
router.post('/', unggahFotoKunjungan, parseData, kunjunganRules, validate, buat);

export default router;