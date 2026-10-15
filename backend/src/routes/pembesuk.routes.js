import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { idRules, listRules, pembesukRules } from '../validators/pembesuk.validator.js';
import { daftar, detail, tambah, ubah, hapus } from '../controllers/pembesuk.controller.js';

const router = Router();

// Semua endpoint pembesuk wajib login (admin dan petugas)
router.use(verifyToken);

router.get('/', listRules, validate, daftar);
router.get('/:id', idRules, validate, detail);
router.post('/', pembesukRules, validate, tambah);
router.put('/:id', idRules, pembesukRules, validate, ubah);
router.delete('/:id', idRules, validate, hapus);

export default router;