// Menyamarkan nama untuk ditampilkan di form publik.
// "Budi Santoso" -> "B*** S***". Jumlah bintang tetap supaya panjang nama tidak bocor.
export function samarkanNama(nama) {
  return String(nama)
    .trim()
    .split(/\s+/)
    .map((kata) => `${Array.from(kata)[0]}***`)
    .join(' ');
}