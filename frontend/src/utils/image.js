// Memperkecil foto dari kamera ponsel (bisa 5-10 MB) sebelum dikirim.
// Target kontrak: 150-300 KB. Dicoba dari kualitas tinggi ke rendah sampai di bawah 300 KB.
const TARGET_BYTES = 300 * 1024;

const toBlob = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

export async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  try {
    let smallest = null;
    for (const maxSize of [1280, 1024, 800]) {
      const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.75, 0.65, 0.55, 0.45]) {
        const blob = await toBlob(canvas, quality);
        if (!blob) continue;
        if (!smallest || blob.size < smallest.size) smallest = blob;
        if (blob.size <= TARGET_BYTES) return blob;
      }
    }
    if (!smallest) throw new Error('Gagal memproses foto');
    return smallest;
  } finally {
    bitmap.close?.();
  }
}