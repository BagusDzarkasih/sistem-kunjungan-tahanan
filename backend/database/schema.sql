-- Skema database: Sistem Manajemen Kunjungan Tahanan
-- MySQL 8 / MariaDB 10.4+ (XAMPP), mesin InnoDB, karakter utf8mb4
-- Cara pakai: impor file ini lewat phpMyAdmin atau jalankan: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS kunjungan_tahanan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kunjungan_tahanan;

CREATE TABLE pengguna (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nama          VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','petugas') NOT NULL DEFAULT 'petugas',
  aktif         TINYINT(1)   NOT NULL DEFAULT 1,
  dibuat_pada   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE tahanan (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nama              VARCHAR(150) NOT NULL,
  status_verifikasi ENUM('belum','terverifikasi') NOT NULL DEFAULT 'belum',
  diverifikasi_oleh INT NULL,
  diverifikasi_pada DATETIME NULL,
  dibuat_pada       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tahanan_nama (nama),
  CONSTRAINT fk_tahanan_verifikator FOREIGN KEY (diverifikasi_oleh)
    REFERENCES pengguna(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE pembesuk (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nik         CHAR(16)     NOT NULL UNIQUE,
  nama        VARCHAR(100) NOT NULL,
  alamat      TEXT         NOT NULL,
  no_hp       VARCHAR(20)  NOT NULL,
  foto_ktp    VARCHAR(255) NULL,           -- path file, bukan gambarnya. Wajib untuk pembesuk baru (dicek di API)
  dibuat_pada DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE kunjungan (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  no_urut           INT NOT NULL UNIQUE,   -- nomor registrasi, dibuat oleh aplikasi di dalam transaksi
  tahanan_id        INT NOT NULL,
  tanggal           DATE NOT NULL,
  status            ENUM('menunggu','disetujui','ditolak','kedaluwarsa') NOT NULL DEFAULT 'menunggu',
  alasan_penolakan  TEXT NULL,
  setuju_peraturan  TINYINT(1) NOT NULL,
  waktu_setuju      DATETIME NOT NULL,
  diproses_oleh     INT NULL,
  diproses_pada     DATETIME NULL,
  didaftarkan_oleh  INT NULL,              -- kosong = diisi pembesuk sendiri, terisi = didaftarkan petugas (KF-24)
  dibuat_pada       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kunjungan_tanggal (tanggal),
  INDEX idx_kunjungan_status (status),
  CONSTRAINT fk_kunjungan_tahanan FOREIGN KEY (tahanan_id)
    REFERENCES tahanan(id) ON DELETE RESTRICT,
  CONSTRAINT fk_kunjungan_diproses FOREIGN KEY (diproses_oleh)
    REFERENCES pengguna(id) ON DELETE SET NULL,
  CONSTRAINT fk_kunjungan_didaftarkan FOREIGN KEY (didaftarkan_oleh)
    REFERENCES pengguna(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE detail_kunjungan (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  kunjungan_id  INT NOT NULL,
  pembesuk_id   INT NOT NULL,
  hubungan      VARCHAR(50)  NOT NULL,
  foto_pembesuk VARCHAR(255) NOT NULL,     -- path file, diambil setiap kunjungan
  UNIQUE KEY uq_kunjungan_pembesuk (kunjungan_id, pembesuk_id),
  CONSTRAINT fk_detail_kunjungan FOREIGN KEY (kunjungan_id)
    REFERENCES kunjungan(id) ON DELETE CASCADE,
  CONSTRAINT fk_detail_pembesuk FOREIGN KEY (pembesuk_id)
    REFERENCES pembesuk(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE pengaturan (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  kunci VARCHAR(50) NOT NULL UNIQUE,
  nilai TEXT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE log_aktivitas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  pengguna_id   INT NULL,
  aksi          VARCHAR(100) NOT NULL,
  tabel_terkait VARCHAR(50)  NULL,
  id_terkait    INT NULL,
  waktu         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_pengguna FOREIGN KEY (pengguna_id)
    REFERENCES pengguna(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Nilai awal pengaturan
INSERT INTO pengaturan (kunci, nilai) VALUES
  ('teks_peraturan', 'Isi peraturan besuk di sini.'),
  ('masa_simpan_foto_bulan', '12'),
  ('kedaluwarsa_jam', '24');

-- Akun admin pertama TIDAK dibuat di sini karena password harus di-hash.
-- Buat lewat skrip seed di backend (langkah berikutnya).
