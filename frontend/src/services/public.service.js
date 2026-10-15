// Pemanggil endpoint publik (tanpa login) untuk form pembesuk.
// Mengikuti Kontrak API Draf 1 (12 Oktober 2026), bagian 2 "Publik".
import api from './api';

// GET /api/peraturan -> teks peraturan untuk pop-up.
export async function getRules() {
  const { data } = await api.get('/peraturan');
  if (typeof data === 'string') return data;
  return data.peraturan ?? data.nilai ?? '';
}

// GET /api/tahanan/cari?q=abc -> [{ id, nama }] (minimal 3 huruf, maksimal 10 hasil)
export async function searchPrisoners(query, signal) {
  const { data } = await api.get('/tahanan/cari', { params: { q: query }, signal });
  const list = Array.isArray(data) ? data : data?.data ?? data?.tahanan ?? [];
  return list.map((t) => ({ id: t.id, nama: t.nama }));
}

// POST /api/pembesuk/cek-nik, body { nik }
// Balasan: sudah terdaftar atau belum, plus nama tersamar (misalnya "B*** S****").
export async function checkVisitorNik(nik, signal) {
  try {
    const { data } = await api.post('/pembesuk/cek-nik', { nik }, { signal });
    const d = data?.data ?? data ?? {};
    const found = Boolean(d.ditemukan ?? d.terdaftar ?? d.found);
    return { found, maskedName: found ? d.nama_tersamar ?? d.nama ?? '' : '' };
  } catch (err) {
    if (err.response?.status === 404) return { found: false, maskedName: '' };
    throw err;
  }
}

// Pembesuk lama = NIK sudah dicek, hasilnya "ditemukan", dan NIK belum diubah lagi.
export const isKnownVisitor = (p) => p.nikStatus === 'lama' && p.nikChecked === p.nik;

// POST /api/kunjungan (multipart/form-data)
//  - bagian "data": teks JSON
//  - foto_pembesuk_N: wajib untuk semua pembesuk
//  - foto_ktp_N: hanya untuk pembesuk baru
export async function submitVisit({ tahanan, tokenCaptcha, pembesuk }) {
  const data = {
    // Dipilih dari saran -> tahanan_id. Diketik sendiri -> tahanan_nama_baru.
    ...(tahanan.id ? { tahanan_id: tahanan.id } : { tahanan_nama_baru: tahanan.nama.trim() }),
    setuju_peraturan: true,
    token_captcha: tokenCaptcha,
    pembesuk: pembesuk.map((p) => ({
      nik: p.nik,
      nama: p.nama.trim(),
      alamat: p.alamat.trim(),
      no_hp: p.noHp,
      hubungan: p.hubungan,
    })),
  };

  const form = new FormData();
  form.append('data', JSON.stringify(data));

  pembesuk.forEach((p, i) => {
    form.append(`foto_pembesuk_${i}`, p.fotoPembesuk, `pembesuk_${i}.jpg`);
    if (!isKnownVisitor(p) && p.fotoKtp) {
      form.append(`foto_ktp_${i}`, p.fotoKtp, `ktp_${i}.jpg`);
    }
  });

  const res = await api.post('/kunjungan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.data ?? res.data;
}