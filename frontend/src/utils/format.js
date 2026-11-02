// Format tanggal untuk tampilan. Server mengirim teks "2026-10-29" atau "2026-10-29 14:05:00"
// (tanpa zona waktu), jadi diurai dari teksnya langsung supaya tidak bergeser hari.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// "2026-10-29" -> "29 Okt 2026"
export function formatDate(value) {
  if (!value) return '-';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : String(value);
}

// "2026-10-29 14:05:00" -> "29 Okt 2026, 14:05"
export function formatDateTime(value) {
  if (!value) return '-';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}, ${m[4]}:${m[5]}` : formatDate(value);
}