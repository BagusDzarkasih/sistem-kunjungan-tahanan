import 'dotenv/config';
import rateLimit from 'express-rate-limit';

const angka = (nilai, bawaan) => (Number(nilai) > 0 ? Number(nilai) : bawaan);

const JENDELA_MS = angka(process.env.RL_JENDELA_MENIT, 15) * 60 * 1000;

function buatPembatas(limit) {
  return rateLimit({
    windowMs: JENDELA_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        kode: 'TERLALU_BANYAK_REQUEST',
        pesan: 'Terlalu banyak permintaan, silakan coba lagi beberapa menit lagi',
      }),
  });
}

// Setiap endpoint punya hitungan sendiri (per alamat IP)
export const batasCekNik = buatPembatas(angka(process.env.RL_CEKNIK_MAKS, 30));
export const batasKunjungan = buatPembatas(angka(process.env.RL_KUNJUNGAN_MAKS, 10));