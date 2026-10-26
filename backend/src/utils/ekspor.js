import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const CATATAN = 'Total kunjungan dan semua tabel hanya menghitung kunjungan berstatus disetujui.';

function namaPeriode(bulan) {
  const [tahun, bln] = bulan.split('-').map(Number);
  return `${NAMA_BULAN[bln - 1]} ${tahun}`;
}

function waktuCetak() {
  return new Date().toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  });
}

const jumlah = (daftar, kunci) => daftar.reduce((total, item) => total + Number(item[kunci]), 0);

const teksPembesuk = (daftar) => daftar.map((p) => `${p.nama} (${p.hubungan})`).join('; ');

// ---------- EXCEL ----------

const tebal = (baris) => {
  baris.font = { bold: true };
  return baris;
};

function buatSheet(wb, nama, kolom, data) {
  const sheet = wb.addWorksheet(nama);
  sheet.columns = kolom; // kolom berisi { header, key, width }
  tebal(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  data.forEach((d) => sheet.addRow(d));
  return sheet;
}

export async function buatXlsx(laporan) {
  const { periode, ringkasan, per_hari, per_tahanan, rincian } = laporan;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistem Manajemen Kunjungan Tahanan';
  wb.created = new Date();

  // Sheet 1: Ringkasan
  const s1 = wb.addWorksheet('Ringkasan');
  s1.columns = [{ width: 34 }, { width: 40 }];
  s1.addRow(['Laporan Kunjungan Tahanan']).font = { bold: true, size: 14 };
  s1.addRow(['Periode', `${namaPeriode(periode.bulan)} (${periode.dari} sampai ${periode.sampai})`]);
  s1.addRow(['Dicetak', waktuCetak()]);
  s1.addRow([]);
  tebal(s1.addRow(['Keterangan', 'Jumlah']));
  s1.addRow(['Total kunjungan (disetujui)', ringkasan.total_kunjungan]);
  s1.addRow(['Total pembesuk', ringkasan.total_pembesuk]);
  s1.addRow(['Kunjungan ditolak', ringkasan.ditolak]);
  s1.addRow(['Kunjungan menunggu', ringkasan.menunggu]);
  s1.addRow(['Kunjungan kedaluwarsa', ringkasan.kedaluwarsa]);
  s1.addRow([]);
  s1.addRow([CATATAN]);

  // Sheet 2: Per hari
  const s2 = buatSheet(
    wb,
    'Per Hari',
    [
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'Jumlah Kunjungan', key: 'jumlah_kunjungan', width: 20 },
      { header: 'Jumlah Pembesuk', key: 'jumlah_pembesuk', width: 20 },
    ],
    per_hari
  );
  tebal(
    s2.addRow({
      tanggal: 'Total',
      jumlah_kunjungan: jumlah(per_hari, 'jumlah_kunjungan'),
      jumlah_pembesuk: jumlah(per_hari, 'jumlah_pembesuk'),
    })
  );

  // Sheet 3: Per tahanan
  const s3 = buatSheet(
    wb,
    'Per Tahanan',
    [
      { header: 'Nama Tahanan', key: 'tahanan_nama', width: 36 },
      { header: 'Jumlah Kunjungan', key: 'jumlah_kunjungan', width: 20 },
      { header: 'Jumlah Pembesuk', key: 'jumlah_pembesuk', width: 20 },
    ],
    per_tahanan
  );
  tebal(
    s3.addRow({
      tahanan_nama: 'Total',
      jumlah_kunjungan: jumlah(per_tahanan, 'jumlah_kunjungan'),
      jumlah_pembesuk: jumlah(per_tahanan, 'jumlah_pembesuk'),
    })
  );

  // Sheet 4: Rincian
  const s4 = buatSheet(
    wb,
    'Rincian',
    [
      { header: 'No Urut', key: 'no_urut', width: 10 },
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'Nama Tahanan', key: 'tahanan_nama', width: 30 },
      { header: 'Jumlah Pembesuk', key: 'jumlah_pembesuk', width: 18 },
      { header: 'Pembesuk (hubungan)', key: 'pembesuk', width: 60 },
    ],
    rincian.map((r) => ({
      no_urut: r.no_urut,
      tanggal: r.tanggal,
      tahanan_nama: r.tahanan_nama,
      jumlah_pembesuk: r.pembesuk.length,
      pembesuk: teksPembesuk(r.pembesuk),
    }))
  );
  s4.getColumn('pembesuk').alignment = { wrapText: true, vertical: 'top' };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------- PDF ----------

const KIRI = 40;
const LEBAR = 515; // A4 (595) dikurangi margin kiri dan kanan 40
const PAD = 4;

// Menggambar tabel dengan garis. Header diulang kalau tabel pindah halaman.
function tabel(doc, judul, kolom, baris) {
  const judulKolom = kolom.map((k) => k.judul);
  const batasBawah = () => doc.page.height - doc.page.margins.bottom;

  const ukur = (sel, header) => {
    doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    const tinggiTeks = Math.max(
      ...sel.map((teks, i) =>
        doc.heightOfString(String(teks), { width: kolom[i].lebar - PAD * 2 })
      )
    );
    return tinggiTeks + PAD * 2;
  };

  const gambar = (sel, header, tinggi) => {
    const y = doc.y;
    let x = KIRI;
    sel.forEach((teks, i) => {
      const k = kolom[i];
      doc.rect(x, y, k.lebar, tinggi).fillAndStroke(header ? '#e5e5e5' : '#ffffff', '#999999');
      doc
        .fillColor('black')
        .font(header ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .text(String(teks), x + PAD, y + PAD, {
          width: k.lebar - PAD * 2,
          align: k.rata || 'left',
        });
      x += k.lebar;
    });
    doc.x = KIRI;
    doc.y = y + tinggi;
  };

  const tulis = (sel, header) => {
    let tinggi = ukur(sel, header);
    if (doc.y + tinggi > batasBawah()) {
      doc.addPage();
      if (!header) {
        gambar(judulKolom, true, ukur(judulKolom, true));
        tinggi = ukur(sel, false);
      }
    }
    gambar(sel, header, tinggi);
  };

  // Judul tabel (pindah halaman dulu kalau sisa ruang terlalu sedikit)
  doc.y += 14;
  if (doc.y > batasBawah() - 90) doc.addPage();
  doc.fillColor('black').font('Helvetica-Bold').fontSize(12).text(judul, KIRI, doc.y, { width: LEBAR });
  doc.y += 4;

  tulis(judulKolom, true);
  if (baris.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(9).text('Tidak ada data.', KIRI, doc.y + 4, { width: LEBAR });
    return;
  }
  baris.forEach((sel) => tulis(sel, false));
}

export function buatPdf(laporan) {
  return new Promise((resolve, reject) => {
    const { periode, ringkasan, per_hari, per_tahanan, rincian } = laporan;

    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const potongan = [];
    doc.on('data', (c) => potongan.push(c));
    doc.on('end', () => resolve(Buffer.concat(potongan)));
    doc.on('error', reject);

    try {
      // Judul
      doc.font('Helvetica-Bold').fontSize(16).text('Laporan Kunjungan Tahanan', KIRI, 40, { width: LEBAR });
      doc.font('Helvetica').fontSize(10);
      doc.text(
        `Periode: ${namaPeriode(periode.bulan)} (${periode.dari} sampai ${periode.sampai})`,
        KIRI,
        doc.y + 4,
        { width: LEBAR }
      );
      doc.text(`Dicetak: ${waktuCetak()}`, KIRI, doc.y, { width: LEBAR });
      doc.fontSize(8).fillColor('#555555').text(CATATAN, KIRI, doc.y + 2, { width: LEBAR });
      doc.fillColor('black');

      tabel(
        doc,
        'Ringkasan',
        [
          { judul: 'Keterangan', lebar: 350 },
          { judul: 'Jumlah', lebar: 165, rata: 'right' },
        ],
        [
          ['Total kunjungan (disetujui)', ringkasan.total_kunjungan],
          ['Total pembesuk', ringkasan.total_pembesuk],
          ['Kunjungan ditolak', ringkasan.ditolak],
          ['Kunjungan menunggu', ringkasan.menunggu],
          ['Kunjungan kedaluwarsa', ringkasan.kedaluwarsa],
        ]
      );

      tabel(
        doc,
        'Kunjungan per hari',
        [
          { judul: 'Tanggal', lebar: 175 },
          { judul: 'Jumlah Kunjungan', lebar: 170, rata: 'right' },
          { judul: 'Jumlah Pembesuk', lebar: 170, rata: 'right' },
        ],
        [
          ...per_hari.map((h) => [h.tanggal, h.jumlah_kunjungan, h.jumlah_pembesuk]),
          ['Total', jumlah(per_hari, 'jumlah_kunjungan'), jumlah(per_hari, 'jumlah_pembesuk')],
        ]
      );

      tabel(
        doc,
        'Kunjungan per tahanan',
        [
          { judul: 'No', lebar: 35 },
          { judul: 'Nama Tahanan', lebar: 280 },
          { judul: 'Kunjungan', lebar: 100, rata: 'right' },
          { judul: 'Pembesuk', lebar: 100, rata: 'right' },
        ],
        per_tahanan.length === 0
          ? []
          : [
              ...per_tahanan.map((t, i) => [i + 1, t.tahanan_nama, t.jumlah_kunjungan, t.jumlah_pembesuk]),
              ['', 'Total', jumlah(per_tahanan, 'jumlah_kunjungan'), jumlah(per_tahanan, 'jumlah_pembesuk')],
            ]
      );

      tabel(
        doc,
        'Rincian kunjungan',
        [
          { judul: 'No Urut', lebar: 50 },
          { judul: 'Tanggal', lebar: 70 },
          { judul: 'Nama Tahanan', lebar: 130 },
          { judul: 'Pembesuk (hubungan)', lebar: 265 },
        ],
        rincian.map((r) => [r.no_urut, r.tanggal, r.tahanan_nama, teksPembesuk(r.pembesuk) || '-'])
      );

      // Nomor halaman. margin bawah dinolkan dulu supaya menulis di kaki halaman
      // tidak membuat pdfkit menambah halaman baru.
      const halaman = doc.bufferedPageRange();
      for (let i = 0; i < halaman.count; i += 1) {
        doc.switchToPage(halaman.start + i);
        doc.page.margins.bottom = 0;
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#555555')
          .text(`Halaman ${i + 1} dari ${halaman.count}`, KIRI, doc.page.height - 28, {
            width: LEBAR,
            align: 'center',
          });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}