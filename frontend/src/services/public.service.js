// Pemanggil endpoint publik (tanpa login) untuk form pembesuk.
// Mengikuti Kontrak API Draf 5 (form publik tanpa saran nama tahanan dan tanpa CAPTCHA).
//
// Mode data tiruan (mock): HANYA saat npm run dev dan frontend/.env berisi VITE_USE_MOCK=true.
// Dipakai selagi backend belum jalan. Tidak pernah aktif di hasil npm run build.
import api from './api';

const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_RULES = `1. Pembesuk wajib membawa kartu identitas asli (KTP).
2. Pembesuk wajib mengisi data dengan benar dan jujur.
3. Dilarang membawa barang terlarang ke area kunjungan.
4. Pembesuk wajib mengikuti arahan petugas selama kunjungan.
5. Petugas berhak menolak kunjungan jika data tidak sesuai.

(Data tiruan mode pengembangan, bukan peraturan resmi.)`;

// GET /api/peraturan -> teks peraturan untuk pop-up.
export async function getRules() {
  if (USE_MOCK) {
    await wait(300);
    return MOCK_RULES;
  }
  const { data } = await api.get('/peraturan');
  if (typeof data === 'string') return data;
  return data.teks ?? data.peraturan ?? data.nilai ?? '';
}

// POST /api/pembesuk/cek-nik, body { nik }
// Balasan: sudah terdaftar atau belum, plus nama tersamar (misalnya "B*** S****").
// Mock: NIK yang berakhiran 1111 dianggap pembesuk lama.
export async function checkVisitorNik(nik, signal) {
  if (USE_MOCK) {
    await wait(400);
    const found = nik.endsWith('1111');
    return { found, maskedName: found ? 'B*** S****' : '' };
  }
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
//  - foto_pembesuk_N: selfie, wajib untuk semua pembesuk
//  - foto_ktp_N: hanya untuk pembesuk baru
// Hubungan diisi per pembesuk. Alamat dan nomor HP diisi sekali per kunjungan,
// lalu disalin ke tiap pembesuk (kontrak meminta alamat dan no_hp per pembesuk).
// Nama tahanan selalu diketik pembesuk (tahanan_nama_baru). Server yang menautkannya.
export async function submitVisit({ tahananNama, alamat, noHp, pembesuk }) {
  const data = {
    tahanan_nama_baru: tahananNama.trim(),
    setuju_peraturan: true,
    pembesuk: pembesuk.map((p) => ({
      nik: p.nik,
      nama: p.nama.trim(),
      alamat: alamat.trim(),
      no_hp: noHp,
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

  if (USE_MOCK) {
    await wait(800);
    // Lihat isi yang akan dikirim di Console (F12) untuk dicocokkan dengan kontrak.
    console.log('[MOCK] data:', data);
    console.log('[MOCK] file:', [...form.keys()].filter((k) => k !== 'data'));
    return { no_urut: 153, status: 'menunggu' };
  }

  const res = await api.post('/kunjungan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.data ?? res.data;
}