import pool from '../config/db.js';

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ kode: 'SERVER_ERROR', pesan: 'Terjadi kesalahan pada server' });
};

const tidakDitemukan = (res) =>
  res.status(404).json({ kode: 'TIDAK_DITEMUKAN', pesan: 'Data tahanan tidak ditemukan' });

export async function cari(req, res) {
  const q = String(req.query.q).trim();
  if (q.length < 3) return res.json({ data: [] });

  try {
    const [rows] = await pool.query(
      'SELECT id, nama FROM tahanan WHERE nama LIKE ? ORDER BY nama LIMIT 10',
      [`%${q}%`]
    );
    res.json({ data: rows });
  } catch (err) {
    serverError(res, err);
  }
}

export async function daftar(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const q = req.query.q ? String(req.query.q).trim() : '';
  const status = req.query.status;

  const where = [];
  const params = [];
  if (q) {
    where.push('nama LIKE ?');
    params.push(`%${q}%`);
  }
  if (status) {
    where.push('status_verifikasi = ?');
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM tahanan ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT id, nama, status_verifikasi, dibuat_pada
       FROM tahanan ${whereSql}
       ORDER BY dibuat_pada DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, page, limit, total });
  } catch (err) {
    serverError(res, err);
  }
}

export async function detail(req, res) {
  const id = Number(req.params.id);
  try {
    const [rows] = await pool.query(
      `SELECT id, nama, status_verifikasi, diverifikasi_oleh, diverifikasi_pada, dibuat_pada
       FROM tahanan WHERE id = ?`,
      [id]
    );
    if (!rows[0]) return tidakDitemukan(res);

    const [riwayat] = await pool.query(
      `SELECT k.id, k.no_urut, k.tanggal, k.status, COUNT(d.id) AS jumlah_pembesuk
       FROM kunjungan k
       LEFT JOIN detail_kunjungan d ON d.kunjungan_id = k.id
       WHERE k.tahanan_id = ?
       GROUP BY k.id
       ORDER BY k.tanggal DESC, k.id DESC`,
      [id]
    );
    res.json({ tahanan: rows[0], riwayat });
  } catch (err) {
    serverError(res, err);
  }
}

// Tahanan yang ditambah petugas langsung berstatus terverifikasi
export async function tambah(req, res) {
  try {
    const [hasil] = await pool.query(
      `INSERT INTO tahanan (nama, status_verifikasi, diverifikasi_oleh, diverifikasi_pada)
       VALUES (?, 'terverifikasi', ?, NOW())`,
      [req.body.nama, req.user.id]
    );
    const [rows] = await pool.query(
      'SELECT id, nama, status_verifikasi, dibuat_pada FROM tahanan WHERE id = ?',
      [hasil.insertId]
    );
    res.status(201).json({ tahanan: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
}

export async function ubah(req, res) {
  const id = Number(req.params.id);
  try {
    const [ada] = await pool.query('SELECT id FROM tahanan WHERE id = ?', [id]);
    if (!ada[0]) return tidakDitemukan(res);

    await pool.query('UPDATE tahanan SET nama = ? WHERE id = ?', [req.body.nama, id]);
    const [rows] = await pool.query(
      'SELECT id, nama, status_verifikasi, dibuat_pada FROM tahanan WHERE id = ?',
      [id]
    );
    res.json({ tahanan: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
}

export async function verifikasi(req, res) {
  const id = Number(req.params.id);
  try {
    const [ada] = await pool.query('SELECT id FROM tahanan WHERE id = ?', [id]);
    if (!ada[0]) return tidakDitemukan(res);

    await pool.query(
      `UPDATE tahanan
       SET status_verifikasi = 'terverifikasi', diverifikasi_oleh = ?, diverifikasi_pada = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );
    const [rows] = await pool.query(
      'SELECT id, nama, status_verifikasi, diverifikasi_pada FROM tahanan WHERE id = ?',
      [id]
    );
    res.json({ tahanan: rows[0] });
  } catch (err) {
    serverError(res, err);
  }
}

export async function hapus(req, res) {
  const id = Number(req.params.id);
  const bentrok = (r) =>
    r.status(409).json({
      kode: 'MASIH_DIPAKAI',
      pesan: 'Tahanan sudah punya kunjungan, tidak bisa dihapus',
    });

  try {
    const [ada] = await pool.query('SELECT id FROM tahanan WHERE id = ?', [id]);
    if (!ada[0]) return tidakDitemukan(res);

    const [[{ jumlah }]] = await pool.query(
      'SELECT COUNT(*) AS jumlah FROM kunjungan WHERE tahanan_id = ?',
      [id]
    );
    if (jumlah > 0) return bentrok(res);

    await pool.query('DELETE FROM tahanan WHERE id = ?', [id]);
    res.json({ pesan: 'Data tahanan dihapus' });
  } catch (err) {
    // Jaga-jaga kalau ada kunjungan masuk tepat di antara pengecekan dan penghapusan
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return bentrok(res);
    serverError(res, err);
  }
}

export async function gabung(req, res) {
  const sumberId = Number(req.body.sumber_id);
  const tujuanId = Number(req.body.tujuan_id);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Kunci kedua baris, diurutkan menurut id supaya dua permintaan bersamaan tidak saling menunggu
    const [terkunci] = await conn.query(
      'SELECT id FROM tahanan WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
      [sumberId, tujuanId]
    );
    const sumberAda = terkunci.some((r) => r.id === sumberId);
    const tujuanAda = terkunci.some((r) => r.id === tujuanId);

    if (!sumberAda || !tujuanAda) {
      await conn.rollback();
      return res.status(404).json({
        kode: 'TIDAK_DITEMUKAN',
        pesan: !sumberAda
          ? 'Tahanan sumber tidak ditemukan'
          : 'Tahanan tujuan tidak ditemukan',
      });
    }

    const [pindah] = await conn.query(
      'UPDATE kunjungan SET tahanan_id = ? WHERE tahanan_id = ?',
      [tujuanId, sumberId]
    );
    await conn.query('DELETE FROM tahanan WHERE id = ?', [sumberId]);

    const [rows] = await conn.query(
      'SELECT id, nama, status_verifikasi, dibuat_pada FROM tahanan WHERE id = ?',
      [tujuanId]
    );

    await conn.commit();
    res.json({
      pesan: 'Data tahanan berhasil digabung',
      tahanan: rows[0],
      kunjungan_dipindah: pindah.affectedRows,
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (e) {
        console.error(e);
      }
    }
    if (err.code === 'ER_LOCK_DEADLOCK') {
      return res.status(409).json({
        kode: 'BENTROK',
        pesan: 'Terjadi bentrok dengan proses lain, silakan coba lagi',
      });
    }
    serverError(res, err);
  } finally {
    if (conn) conn.release();
  }
}