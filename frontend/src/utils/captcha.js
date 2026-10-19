// Pengaturan CAPTCHA bersama.
// Mode lewati HANYA berlaku saat npm run dev, dan hanya kalau frontend/.env berisi:
//   VITE_CAPTCHA_DEV_BYPASS=true
// Backend juga harus melewati verifikasi CAPTCHA selama pengembangan.
export const CAPTCHA_DEV_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_CAPTCHA_DEV_BYPASS === 'true';
export const CAPTCHA_DEV_TOKEN = 'dev-bypass';