import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import {
  idRules, cariRules, listRules, tahananRules,
} from '../validators/tahanan.validator.js';
import {
  cari, daftar, detail, tambah, ubah, verifikasi, hapus,
} from '../controllers/tahanan.controller.js';

const router = Router();

// PUBLIK. Harus di atas '/:id', kalau tidak "cari" dianggap sebagai id.
router.get('/cari', cariRules, validate, cari);

// Semua route di bawah ini wajib login (admin dan petugas sama-sama boleh)
router.use(verifyToken);

router.get('/', listRules, validate, daftar);
router.get('/:id', idRules, validate, detail);
router.post('/', tahananRules, validate, tambah);
router.put('/:id', idRules, tahananRules, validate, ubah);
router.patch('/:id/verifikasi', idRules, validate, verifikasi);
router.delete('/:id', idRules, validate, hapus);

export default router;