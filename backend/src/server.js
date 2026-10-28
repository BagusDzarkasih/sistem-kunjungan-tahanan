import app from './app.js';
import { jalankanKedaluwarsa } from './utils/kedaluwarsa.js';
import { jalankanHapusFotoLama } from './utils/hapusFotoLama.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  jalankanKedaluwarsa();
  jalankanHapusFotoLama();
});