import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { fotoRules } from '../validators/foto.validator.js';
import { tampilkan } from '../controllers/foto.controller.js';

const router = Router();

// Foto bersifat privat: wajib login (admin dan petugas sama-sama boleh)
router.use(verifyToken);

router.get('/:jenis/:id', fotoRules, validate, tampilkan);

export default router;