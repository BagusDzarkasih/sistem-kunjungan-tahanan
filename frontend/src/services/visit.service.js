// Pemanggil endpoint kunjungan untuk petugas dan admin (butuh login).
// Bentuk balasan GET /api/kunjungan belum tertulis di kontrak, jadi beberapa kemungkinan
// dibaca di normalizeList. Kalau berbeda, cukup ubah file ini.
//
// Mode data tiruan (mock): HANYA saat npm run dev dan frontend/.env berisi VITE_USE_MOCK=true.
import api from './api';

const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pad = (n) => String(n).padStart(2, '0');
const toDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const MOCK_TAHANAN = ['Budi Santoso', 'Agus Setiawan', 'Rudi Hermawan', 'Dedi Pratama', 'Joko Susilo'];
const MOCK_STATUS = ['disetujui', 'ditolak', 'kedaluwarsa'];

// 37 kunjungan tiruan: 12 terbaru berstatus menunggu, sisanya bergantian.
const MOCK_VISITS = Array.from({ length: 37 }, (_, i) => ({
  id: i + 1,
  no_urut: 153 + i,
  tanggal: toDate(new Date(2026, 9, 19 - Math.floor((36 - i) / 5))),
  tahanan_nama: MOCK_TAHANAN[i % MOCK_TAHANAN.length],
  jumlah_pembesuk: (i % 4) + 1,
  status: i >= 25 ? 'menunggu' : MOCK_STATUS[i % MOCK_STATUS.length],
})).sort((a, b) => b.id - a.id);

function normalizeRow(k) {
  const no = k.no_urut ?? k.noUrut ?? k.id;
  return {
    id: k.id,
    noUrut: String(no ?? '').padStart(4, '0'),
    tanggal: k.tanggal ?? '',
    tahanan:
      k.tahanan_nama ??
      k.nama_tahanan ??
      k.tahanan?.nama ??
      (typeof k.tahanan === 'string' ? k.tahanan : ''),
    jumlahPembesuk: k.jumlah_pembesuk ?? k.jumlahPembesuk ?? k.pembesuk?.length ?? 0,
    status: k.status ?? '',
  };
}

function normalizeList(data, limit) {
  const rows = Array.isArray(data) ? data : data?.data ?? data?.kunjungan ?? data?.items ?? [];
  const meta = data?.meta ?? data?.pagination ?? data ?? {};
  const total = meta.total ?? meta.total_data ?? data?.total ?? rows.length;
  const totalPages =
    meta.total_halaman ??
    meta.totalPages ??
    meta.total_pages ??
    Math.max(1, Math.ceil(total / limit));
  return { rows: rows.map(normalizeRow), total, totalPages };
}

// GET /api/kunjungan?status=&q=&dari=&sampai=&page=&limit=
export async function getVisits({ status, q, dari, sampai, page = 1, limit = 10 }, signal) {
  if (USE_MOCK) {
    await wait(300);
    const keyword = (q ?? '').toLowerCase();
    const filtered = MOCK_VISITS.filter(
      (v) =>
        (!status || v.status === status) &&
        (!keyword || v.tahanan_nama.toLowerCase().includes(keyword)) &&
        (!dari || v.tanggal >= dari) &&
        (!sampai || v.tanggal <= sampai)
    );
    const start = (page - 1) * limit;
    return normalizeList(
      { data: filtered.slice(start, start + limit), total: filtered.length },
      limit
    );
  }

  const params = { page, limit };
  if (status) params.status = status;
  if (q) params.q = q;
  if (dari) params.dari = dari;
  if (sampai) params.sampai = sampai;
  const { data } = await api.get('/kunjungan', { params, signal });
  return normalizeList(data, limit);
} 