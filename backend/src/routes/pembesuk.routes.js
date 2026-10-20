import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { batasCekNik } from '../middleware/rateLimit.js';
import {
  idRules, listRules, pembesukRules, cekNikRules,
} from '../validators/pembesuk.validator.js';
import { unggahFotoKtp } from '../middleware/upload.js';
import {
  daftar, detail, tambah, ubah, hapus, gantiFotoKtp, cekNik,
} from '../controllers/pembesuk.controller.js';

const router = Router();

// PUBLIK (form pembesuk), dibatasi jumlah request. Harus di atas verifyToken dan di atas '/:id'.
router.post('/cek-nik', batasCekNik, cekNikRules, validate, cekNik);

// Semua endpoint di bawah ini wajib login (admin dan petugas)
router.use(verifyToken);

router.get('/', listRules, validate, daftar);
router.get('/:id', idRules, validate, detail);
router.post('/', pembesukRules, validate, tambah);
router.put('/:id', idRules, pembesukRules, validate, ubah);
router.put('/:id/foto-ktp', idRules, validate, unggahFotoKtp, gantiFotoKtp);
router.delete('/:id', idRules, validate, hapus);

export default router;