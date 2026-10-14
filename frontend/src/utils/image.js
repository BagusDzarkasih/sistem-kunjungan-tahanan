// Memperkecil foto dari kamera ponsel (bisa 5-10 MB) sebelum dikirim.
// Sisi terpanjang maksimal 1280 px, JPEG kualitas 0.7 (biasanya 150-400 KB).
export async function compressImage(file, maxSize = 1280, quality = 0.7) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
  if (!blob) throw new Error('Gagal memproses foto');
  return blob;
}