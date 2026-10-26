import { ambilLaporan } from '../utils/laporan.js';
import { buatPdf, buatXlsx } from '../utils/ekspor.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

const JENIS_FILE = {
  pdf: { mime: 'application/pdf', buat: buatPdf },
  xlsx: {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buat: buatXlsx,
  },
};

// GET /api/laporan/bulanan?bulan=2026-10
export async function bulanan(req, res) {
  try {
    const laporan = await ambilLaporan(req.query.bulan);
    res.json(laporan);
  } catch (err) {
    serverError(res, err);
  }
}

// GET /api/laporan/bulanan/export?bulan=2026-10&format=pdf|xlsx
export async function ekspor(req, res) {
  const { bulan, format } = req.query;
  try {
    const laporan = await ambilLaporan(bulan);
    const { mime, buat } = JENIS_FILE[format];
    const isi = await buat(laporan);

    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="laporan-kunjungan-${bulan}.${format}"`,
      'Content-Length': isi.length,
      'Cache-Control': 'private, no-store',
    });
    res.send(isi);
  } catch (err) {
    serverError(res, err);
  }
}