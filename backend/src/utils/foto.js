import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const folderUtama = () => path.resolve(process.env.UPLOAD_DIR || 'uploads');

// Mengenali jenis file dari byte pertamanya. Hanya JPG dan PNG yang lolos.
export function deteksiJenis(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  const tandaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length > 8 && buf.subarray(0, 8).equals(tandaPng)) return 'png';
  return null;
}

// Menyimpan foto dan mengembalikan path relatif untuk disimpan di database
export async function simpanFoto(subfolder, buf, ekstensi) {
  const nama = `${crypto.randomUUID()}.${ekstensi}`;
  await fs.mkdir(path.join(folderUtama(), subfolder), { recursive: true });
  await fs.writeFile(path.join(folderUtama(), subfolder, nama), buf);
  return `${subfolder}/${nama}`;
}

// Mengubah path relatif dari database menjadi lokasi lengkap di disk.
// Mengembalikan null kalau path kosong atau mencoba keluar dari folder uploads.
export function lokasiFoto(pathRelatif) {
  if (!pathRelatif) return null;
  const utama = folderUtama();
  const lengkap = path.resolve(utama, pathRelatif);
  if (!lengkap.startsWith(utama + path.sep)) return null;
  return lengkap;
}

export async function hapusFoto(pathRelatif) {
  if (!pathRelatif) return;
  const utama = folderUtama();
  const lengkap = path.resolve(utama, pathRelatif);
  if (!lengkap.startsWith(utama + path.sep)) return; // jaga-jaga, jangan keluar dari folder uploads
  try {
    await fs.unlink(lengkap);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(err);
  }
}