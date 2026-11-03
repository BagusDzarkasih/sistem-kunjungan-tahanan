// Pemanggil endpoint laporan bulanan (petugas dan admin, butuh login).
//   GET /api/laporan/bulanan?bulan=2026-10
//     -> { periode, ringkasan, per_hari, per_tahanan, rincian }
//   GET /api/laporan/bulanan/export?bulan=2026-10&format=pdf|xlsx -> file
import api from './api';

export async function getMonthlyReport(bulan, signal) {
  const { data } = await api.get('/laporan/bulanan', { params: { bulan }, signal });
  return data;
}

// Unduh file laporan: diambil sebagai blob (membawa token), lalu disimpan lewat tautan sementara.
export async function downloadReport(bulan, format) {
  const { data } = await api.get('/laporan/bulanan/export', {
    params: { bulan, format },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `laporan-kunjungan-${bulan}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}