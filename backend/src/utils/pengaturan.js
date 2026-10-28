import pool from '../config/db.js';

// Nilai bawaan dipakai kalau barisnya hilang atau isinya bukan angka bulat positif
export const BAWAAN = { kedaluwarsa_jam: 24, masa_simpan_foto_bulan: 12 };

// Dipakai oleh endpoint pengaturan dan oleh job terjadwal, supaya keduanya membaca nilai yang sama
export async function bacaPengaturan() {
  const [rows] = await pool.query(
    'SELECT kunci, nilai FROM pengaturan WHERE kunci IN (?, ?)',
    Object.keys(BAWAAN)
  );
  const hasil = { ...BAWAAN };
  for (const { kunci, nilai } of rows) {
    const angka = Number(nilai);
    if (Number.isInteger(angka) && angka > 0) hasil[kunci] = angka;
  }
  return hasil;
}