// Kotak "Saya bukan robot" (Google reCAPTCHA v2). Menghasilkan token untuk token_captcha.
import ReCAPTCHA from 'react-google-recaptcha';
import { Alert, Box, FormHelperText } from '@mui/material';

// Kunci uji resmi Google: selalu lolos, HANYA untuk pengembangan.
// Untuk demo/produksi isi VITE_CAPTCHA_SITE_KEY di frontend/.env dengan kunci asli.
const TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const SITE_KEY =
  import.meta.env.VITE_CAPTCHA_SITE_KEY || (import.meta.env.DEV ? TEST_SITE_KEY : '');

export default function CaptchaField({ onChange, error }) {
  if (!SITE_KEY) {
    return <Alert severity="error">CAPTCHA belum dikonfigurasi (VITE_CAPTCHA_SITE_KEY).</Alert>;
  }
  return (
    <Box>
      <ReCAPTCHA
        sitekey={SITE_KEY}
        onChange={(token) => onChange(token ?? '')}
        onExpired={() => onChange('')}
        onErrored={() => onChange('')}
      />
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}