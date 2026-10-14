// Pemanggil endpoint publik (tanpa login) untuk form pembesuk.
// Kalau bentuk endpoint atau balasan backend berbeda, cukup ubah file ini.
import api from './api';

// GET /peraturan -> teks peraturan untuk pop-up.
export async function getRules() {
  const { data } = await api.get('/peraturan');
  if (typeof data === 'string') return data;
  return data.peraturan ?? data.nilai ?? '';
}

// GET /pembesuk/nik/:nik -> data pembesuk lama, atau null kalau belum terdaftar (404).
export async function findVisitorByNik(nik, signal) {
  try {
    const { data } = await api.get(`/pembesuk/nik/${nik}`, { signal });
    const v = data?.data ?? data;
    if (!v || !v.nama) return null;
    return {
      nama: v.nama,
      noHp: v.noHp ?? v.no_hp ?? '',
      alamat: v.alamat ?? '',
      hubungan: v.hubungan ?? '',
    };
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

// POST /kunjungan (multipart/form-data) -> mengirim data dan foto.
export async function submitVisit({ namaTahanan, waktuSetuju, pembesuk }) {
  const form = new FormData();
  form.append('namaTahanan', namaTahanan);
  form.append('waktuSetuju', waktuSetuju);

  // Data teks dikirim sebagai JSON, foto dikirim terpisah sebagai file.
  const teks = pembesuk.map((p) => ({
    nama: p.nama.trim(),
    nik: p.nik,
    noHp: p.noHp,
    hubungan: p.hubungan,
    alamat: p.alamat.trim(),
  }));
  form.append('pembesuk', JSON.stringify(teks));

  pembesuk.forEach((p, i) => {
    form.append(`fotoKtp_${i}`, p.fotoKtp, `ktp_${i}.jpg`);
    form.append(`fotoPembesuk_${i}`, p.fotoPembesuk, `pembesuk_${i}.jpg`);
  });

  const { data } = await api.post('/kunjungan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.data ?? data;
}