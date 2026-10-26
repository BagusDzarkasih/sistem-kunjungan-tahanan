import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import pool from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import tahananRoutes from './routes/tahanan.routes.js';
import pembesukRoutes from './routes/pembesuk.routes.js';
import kunjunganRoutes from './routes/kunjungan.routes.js';
import fotoRoutes from './routes/foto.routes.js';
import peraturanRoutes from './routes/peraturan.routes.js';

const app = express();

app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'terhubung' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ kode: 'DB_ERROR', pesan: 'Database tidak dapat dihubungi' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/tahanan', tahananRoutes);
app.use('/api/pembesuk', pembesukRoutes);
app.use('/api/kunjungan', kunjunganRoutes);
app.use('/api/foto', fotoRoutes);
app.use('/api/peraturan', peraturanRoutes);
app.use((req, res) => {
  res.status(404).json({ kode: 'TIDAK_DITEMUKAN', pesan: 'Alamat tidak ditemukan' });
});

export default app;
