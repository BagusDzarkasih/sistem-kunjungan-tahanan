// Kesalahan 400 dari server berbentuk { kode, pesan, errors: [{ field, pesan }] }.
// Fungsi ini mengubahnya menjadi { namaField: 'pesan' } untuk ditampilkan di bawah kolom.
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  const result = {};
  for (const item of list) {
    if (item?.field && !result[item.field]) result[item.field] = item.pesan;
  }
  return result;
}

// Kode kesalahan dari server, misalnya 'MASIH_DIPAKAI'.
export const getErrorCode = (error) => error?.response?.data?.kode ?? '';