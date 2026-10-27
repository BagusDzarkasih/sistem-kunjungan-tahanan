import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import {
  idRules, cariRules, listRules, tahananRules, gabungRules,
} from '../validators/tahanan.validator.js';
import {
  cari, daftar, detail, tambah, ubah, verifikasi, hapus, gabung,
} from '../controllers/tahanan.controller.js';

const router = Router();

// Data tahanan rahasia: semua endpoint wajib login (admin dan petugas sama-sama boleh)
router.use(verifyToken);

// Harus di atas '/:id', kalau tidak "cari" dianggap sebagai id.
router.get('/cari', cariRules, validate, cari);

router.get('/', listRules, validate, daftar);
router.get('/:id', idRules, validate, detail);
router.post('/', tahananRules, validate, tambah);
router.post('/gabung', gabungRules, validate, gabung);
router.put('/:id', idRules, tahananRules, validate, ubah);
router.patch('/:id/verifikasi', idRules, validate, verifikasi);
router.delete('/:id', idRules, validate, hapus);

export default router;