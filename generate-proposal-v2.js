const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  ShadingType,
  BorderStyle,
  HeadingLevel,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  LevelFormat,
} = require('docx');
const fs = require('fs');

// Border style for tables
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };

// Helper function for table cells
function createCell(text, width, options = {}) {
  const { bold = false, shading = null, colSpan = 1, fontSize = 22 } = options;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    columnSpan: colSpan,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, font: 'Arial', size: fontSize })],
      }),
    ],
  });
}

// Helper for section headers
function sectionHeader(text, level = 1) {
  return new Paragraph({
    spacing: { before: level === 1 ? 400 : 300, after: 200 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: level === 1 ? 32 : 28,
        font: 'Arial',
        color: level === 1 ? '2E5090' : '4472C4',
      }),
    ],
  });
}

// Helper for body text
function bodyText(text, options = {}) {
  const {
    bold = false,
    bullet = false,
    size = 22,
    spacing = { before: 80, after: 80 },
  } = options;
  return new Paragraph({
    spacing,
    numbering: bullet ? { reference: 'bullets', level: 0 } : undefined,
    children: [new TextRun({ text, bold, size, font: 'Arial' })],
  });
}

// Helper for sub-header
function subHeader(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        font: 'Arial',
        color: '2E5090',
      }),
    ],
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Arial', size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '2E5090' },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: '4472C4' },
        paragraph: { spacing: { before: 200, after: 160 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'PROPOSAL HRIS SAMUGARA — CONFIDENTIAL',
                  size: 18,
                  color: '999999',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Halaman ', size: 18, font: 'Arial' }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  font: 'Arial',
                }),
                new TextRun({
                  text: ' | Dokumen Penawaran HRIS Samugara',
                  size: 18,
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ===== COVER PAGE =====
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: 'PROPOSAL PENAWARAN',
              bold: true,
              size: 52,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Sistem Human Resource Information System (HRIS)',
              size: 32,
              font: 'Arial',
              color: '4472C4',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [
            new TextRun({
              text: 'PT Samugara',
              bold: true,
              size: 36,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Diajukan oleh:',
              size: 24,
              font: 'Arial',
              color: '666666',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: '[Nama Freelancer / Nama Perusahaan Anda]',
              bold: true,
              size: 26,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 1000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Tanggal: 2 Mei 2026',
              size: 22,
              font: 'Arial',
              color: '666666',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Berlaku hingga: 2 Juni 2026',
              size: 22,
              font: 'Arial',
              color: '666666',
            }),
          ],
        }),

        // Page break
        new Paragraph({ children: [new PageBreak()] }),

        // ===== SECTION 1 =====
        sectionHeader('1. Ringkasan Eksekutif'),
        bodyText(
          'Proposal ini menyajikan penawaran pengembangan Sistem Human Resource Information System (HRIS) yang komprehensif untuk PT Samugara. Sistem ini dirancang untuk mengotomatisasi seluruh proses HR — mulai dari absensi, pengajuan cuti & izin, perhitungan lembur, hingga penggajian dengan perhitungan PPh 21 dan BPJS sesuai regulasi Indonesia.',
        ),
        bodyText(
          'Keunggulan utama penawaran ini adalah backend system yang telah melalui tahap pengembangan intensif dan siap untuk integrasi dengan interface web dan mobile. Hal ini memungkinkan waktu implementasi yang jauh lebih cepat dan biaya yang lebih kompetitif dibandingkan pengembangan dari nol.',
        ),

        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Highlight Penawaran:',
              bold: true,
              size: 24,
              font: 'Arial',
            }),
          ],
        }),
        bodyText(
          'Waktu implementasi 3-4 bulan untuk Phase 1 (MVP) vs 8-12 bulan untuk pengembangan dari nol',
          { bullet: true },
        ),
        bodyText(
          'Backend system 17+ modul telah siap, mengurangi risiko delay teknis',
          { bullet: true },
        ),
        bodyText(
          'Perhitungan payroll sesuai regulasi Indonesia terbaru (PPh 21 TER, BPJS)',
          { bullet: true },
        ),
        bodyText(
          'Tiga model bisnis fleksibel: Beli Putus, SaaS Subscription, atau Custom Development',
          { bullet: true },
        ),
        bodyText('ROI break-even dalam 13-14 bulan untuk model Beli Putus', {
          bullet: true,
        }),

        // ===== SECTION 2 =====
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeader('2. Latar Belakang & Analisis Masalah'),
        bodyText(
          'Berdasarkan diskusi awal dan analisis kebutuhan, teridentifikasi beberapa tantangan utama dalam pengelolaan HR di PT Samugara:',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [2800, 7280],
          rows: [
            new TableRow({
              children: [
                createCell('Area', 2800, { bold: true, shading: '2E5090' }),
                createCell('Tantangan', 7280, {
                  bold: true,
                  shading: '2E5090',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Absensi', 2800),
                createCell(
                  'Proses absensi manual rentan terhadap kesalahan input, sulit memvalidasi kehadiran di lokasi, dan memakan waktu untuk rekonsiliasi',
                  7280,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Cuti & Izin', 2800),
                createCell(
                  'Pengajuan cuti melalui form fisik/verbal sulit dilacak, sering terjadi kehilangan dokumentasi, dan approval membutuhkan waktu lama',
                  7280,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Payroll', 2800),
                createCell(
                  'Perhitungan gaji manual memakan waktu 3-5 hari per bulan, rentan kesalahan PPh 21 dan BPJS, dan sulit menghasilkan slip gaji yang konsisten',
                  7280,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Lembur', 2800),
                createCell(
                  'Perhitungan jam lembur dengan aturan kompleks (pembulatan, uang makan) sering menimbulkan dispute dengan karyawan',
                  7280,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Reporting', 2800),
                createCell(
                  'Laporan HR harus disusun manual di Excel, membutuhkan waktu berjam-jam dan sering tidak up-to-date',
                  7280,
                ),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 300 } }),
        bodyText(
          'Dampak dari tantangan-tantangan ini tidak hanya pada efisiensi operasional, tetapi juga pada kepuasan karyawan dan compliance terhadap regulasi ketenagakerjaan.',
        ),

        // ===== SECTION 3 =====
        sectionHeader('3. Solusi yang Ditawarkan'),
        bodyText(
          'Kami menawarkan solusi HRIS end-to-end yang mencakup tiga komponen utama:',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [2200, 7880],
          rows: [
            new TableRow({
              children: [
                createCell('Komponen', 2200, { bold: true, shading: '2E5090' }),
                createCell('Deskripsi', 7880, {
                  bold: true,
                  shading: '2E5090',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Backend API', 2200, { bold: true }),
                createCell(
                  'Sistem inti berbasis NestJS + TypeScript dengan 17+ modul. Menangani business logic, perhitungan payroll, approval workflow, dan integrasi database. Siap digunakan.',
                  7880,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Web Application', 2200, { bold: true }),
                createCell(
                  'Interface berbasis React untuk Admin, HRD, Manager, dan Atasan. Menyediakan dashboard, manajemen karyawan, approval center, payroll management, dan reporting.',
                  7880,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Mobile Application', 2200, { bold: true }),
                createCell(
                  'Aplikasi Android & iOS untuk karyawan. Fitur utama: absensi dengan selfie + GPS, pengajuan cuti/izin, lihat slip gaji, dan notifikasi approval.',
                  7880,
                ),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 300 } }),
        bodyText(
          'Sistem ini akan di-deploy pada infrastruktur cloud yang aman, dengan backup otomatis dan dukungan teknis pasca go-live.',
        ),

        // ===== SECTION 4 =====
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeader('4. Scope Phase 1 — MVP HRIS (Go-Live 3-4 Bulan)'),
        bodyText(
          'Phase 1 difokuskan pada fitur inti yang paling urgent untuk operasional HR harian. Target go-live: 3-4 bulan dari kick-off.',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [2400, 7680],
          rows: [
            new TableRow({
              children: [
                createCell('Modul', 2400, { bold: true, shading: '4472C4' }),
                createCell('Fitur Detail', 7680, {
                  bold: true,
                  shading: '4472C4',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Attendance', 2400, { bold: true }),
                createCell(
                  'Clock in/out dengan selfie + GPS, validasi radius lokasi, koreksi absensi dengan approval 2-level, auto-mark absent, perhitungan keterlambatan & pulang cepat',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Leave & Time Off', 2400, { bold: true }),
                createCell(
                  'Cuti tahunan (12 hari), cuti umroh (30 hari), izin terlambat/pulang cepat/sakit, tracking saldo real-time, approval workflow',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Employee Mgmt', 2400, { bold: true }),
                createCell(
                  'Data karyawan lengkap, penjadwalan kerja & shift (termasuk security 3 shift), penugasan lokasi, hierarki atasan-bawahan',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Basic Payroll', 2400, { bold: true }),
                createCell(
                  'Slip gaji digital, perhitungan prorate untuk karyawan baru/resign, THR sederhana, export Excel, PDF payslip',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Work Schedule', 2400, { bold: true }),
                createCell(
                  'Jadwal normal & Ramadhan, rotasi shift, integrasi hari libur nasional, penjadwalan otomatis',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Approval', 2400, { bold: true }),
                createCell(
                  'Multi-level approval (Supervisor → Manager HRGA), notifikasi in-app, audit trail perubahan',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('User Access', 2400, { bold: true }),
                createCell(
                  '6 role: Karyawan, Atasan, Manager HRGA, HRD, Admin, Super Admin dengan permission berbeda',
                  7680,
                ),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Deliverables Phase 1:',
              bold: true,
              size: 24,
              font: 'Arial',
            }),
          ],
        }),
        bodyText(
          'Backend API production-ready dengan dokumentasi lengkap (Swagger)',
          { bullet: true },
        ),
        bodyText('Web application untuk Admin/HR/Manager', { bullet: true }),
        bodyText('Mobile application Android & iOS untuk karyawan', {
          bullet: true,
        }),
        bodyText('Deployment ke server production', { bullet: true }),
        bodyText('Training 2 sesi untuk tim Admin & HRD', { bullet: true }),
        bodyText('User manual & dokumentasi teknis', { bullet: true }),
        bodyText('Garansi bug fix 3 bulan', { bullet: true }),

        // ===== SECTION 5 =====
        sectionHeader(
          '5. Scope Phase 2 — Enhancement (2-3 Bulan setelah Phase 1)',
        ),
        bodyText(
          'Phase 2 adalah pengembangan fitur advanced yang dapat diambil setelah Phase 1 stabil. Sifatnya opsional dan fleksibel sesuai kebutuhan.',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [2400, 7680],
          rows: [
            new TableRow({
              children: [
                createCell('Modul', 2400, { bold: true, shading: '4472C4' }),
                createCell('Fitur Detail', 7680, {
                  bold: true,
                  shading: '4472C4',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Advanced Payroll', 2400, { bold: true }),
                createCell(
                  'PPh 21 TER otomatis (bukan dummy), BPJS otomatis (Kesehatan, TK, JP), perhitungan kompleks, batch generate payslip',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Overtime', 2400, { bold: true }),
                createCell(
                  'Rate (Gaji Pokok + Tunjangan)/173, pembulatan jam khusus, uang makan lembur berbasis hari & jam, approval workflow',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Recruitment', 2400, { bold: true }),
                createCell(
                  'Job portal publik dengan slug, tracking pelamar, status lolos/tidak lolos, auto-email rejection',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Push Notification', 2400, { bold: true }),
                createCell(
                  'FCM integration untuk notifikasi approval, reminder absensi, pengumuman perusahaan',
                  7680,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Analytics', 2400, { bold: true }),
                createCell(
                  'Dashboard dengan grafik kehadiran, statistik lembur, trend cuti, report advanced (PDF + Excel)',
                  7680,
                ),
              ],
            }),
          ],
        }),

        // ===== SECTION 6 =====
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeader('6. Opsi Model Harga'),
        bodyText(
          'Kami menyediakan tiga model bisnis yang dapat disesuaikan dengan preferensi dan kondisi keuangan PT Samugara.',
        ),

        // Model A
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Model A: Beli Putus (One-Time Purchase)',
              bold: true,
              size: 28,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Sistem menjadi milik perusahaan 100%. Tidak ada biaya bulanan. Cocok untuk perusahaan yang ingin kontrol penuh atas data dan sistem.',
              size: 22,
              font: 'Arial',
              italics: true,
            }),
          ],
        }),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [4000, 6080],
          rows: [
            new TableRow({
              children: [
                createCell('Investasi Phase 1', 4000),
                createCell('Rp 275.000.000', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Investasi Phase 2', 4000),
                createCell('Rp 175.000.000 (jika diambil)', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Full Package (hemat)', 4000),
                createCell('Rp 425.000.000 (hemat Rp 25 juta)', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Termin', 4000),
                createCell(
                  '40% di awal → 30% setelah demo → 30% setelah go-live',
                  6080,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Include', 4000),
                createCell(
                  'Source code, deployment, training, dokumentasi, garansi 3 bulan',
                  6080,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Exclude', 4000),
                createCell(
                  'Server/cloud (klien siapkan), maintenance tahunan',
                  6080,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Maintenance (opsional)', 4000),
                createCell(
                  'Rp 30.000.000/tahun — update regulasi, bug fix, support',
                  6080,
                ),
              ],
            }),
          ],
        }),

        // Model B
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Model B: SaaS (Software as a Service)',
              bold: true,
              size: 28,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Kami yang mengelola server, maintenance, dan update. Perusahaan tinggal pakai. Bayar setup sekali + subscription bulanan.',
              size: 22,
              font: 'Arial',
              italics: true,
            }),
          ],
        }),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [4000, 6080],
          rows: [
            new TableRow({
              children: [
                createCell('Setup Fee (sekali)', 4000),
                createCell('Rp 100.000.000', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Biaya Bulanan', 4000),
                createCell('Rp 8.000 — Rp 15.000 per karyawan/bulan', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Contoh: 500 karyawan', 4000),
                createCell('Rp 5.000.000 — Rp 7.500.000/bulan', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Contoh: 1.000 karyawan', 4000),
                createCell('Rp 8.000.000 — Rp 15.000.000/bulan', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Minimum Commitment', 4000),
                createCell('12 bulan', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Include', 4000),
                createCell(
                  'Hosting, backup, update regulasi, maintenance, support jam kerja',
                  6080,
                ),
              ],
            }),
          ],
        }),

        // Model C
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Model C: In-House Custom Development',
              bold: true,
              size: 28,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Build from scratch dengan requirement spesifik perusahaan. Cocok jika ada workflow unik atau integrasi dengan sistem existing.',
              size: 22,
              font: 'Arial',
              italics: true,
            }),
          ],
        }),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [4000, 6080],
          rows: [
            new TableRow({
              children: [
                createCell('Discovery & Analysis', 4000),
                createCell('Rp 25.000.000 (2-3 minggu)', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('UI/UX Design', 4000),
                createCell('Rp 50.000.000 (4-6 minggu)', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Development', 4000),
                createCell('Rp 350.000.000 (4-6 bulan)', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Testing & UAT', 4000),
                createCell('Rp 50.000.000 (1-2 bulan)', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('Deployment', 4000),
                createCell('Rp 25.000.000 (2 minggu)', 6080),
              ],
            }),
            new TableRow({
              children: [
                createCell('TOTAL', 4000, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 500.000.000 (6-8 bulan)', 6080, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // ===== LAMPIRAN A: BREAKDOWN HARGA =====
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
          children: [
            new TextRun({
              text: 'LAMPIRAN A',
              bold: true,
              size: 40,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [
            new TextRun({
              text: 'Rincian Biaya Detail (Per Jam Kerja)',
              bold: true,
              size: 32,
              font: 'Arial',
              color: '4472C4',
            }),
          ],
        }),

        bodyText(
          'Lampiran ini menyajikan transparansi perhitungan biaya berdasarkan jam kerja aktual untuk setiap komponen pengembangan. Harga yang ditampilkan adalah hasil perhitungan matematis, bukan angka sembarangan.',
        ),

        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Metodologi Perhitungan',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        bodyText('Rumus: Total Biaya = Σ (Jam per Task × Rate per Jam)'),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [3500, 2500, 4080],
          rows: [
            new TableRow({
              children: [
                createCell('Tipe Rate', 3500, {
                  bold: true,
                  shading: '2E5090',
                }),
                createCell('Nilai', 2500, { bold: true, shading: '2E5090' }),
                createCell('Keterangan', 4080, {
                  bold: true,
                  shading: '2E5090',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Rate Normal', 3500, { bold: true }),
                createCell('Rp 250.000/jam', 2500),
                createCell(
                  'Standar industri developer senior spesialisasi HRIS & payroll',
                  4080,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Rate Khusus (Projek Pertama)', 3500, {
                  bold: true,
                }),
                createCell('Rp 200.000/jam', 2500),
                createCell('Rate promo khusus, hemat Rp 50.000 per jam', 4080),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 200 } }),
        bodyText(
          'Rate Rp 250.000/jam adalah rate yang wajar untuk freelance senior di Indonesia. Software house besar biasanya charge Rp 400.000 — Rp 800.000/jam untuk projek sejenis. Rate khusus Rp 200.000/jam diberikan sebagai apresiasi untuk projek pertama ini.',
        ),

        // Phase 1 Breakdown
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Breakdown Phase 1 — MVP HRIS',
              bold: true,
              size: 28,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        bodyText('Target Go-Live: 3-4 bulan | Total Estimasi: 1.360 jam kerja'),

        // 2.1 Backend
        new Paragraph({ spacing: { before: 300 } }),
        subHeader('A. Backend API — Polish & Integration (180 jam)'),
        bodyText(
          'Backend sudah 80% jadi. Effort di sini adalah polish, testing, missing integration, dan optimasi.',
          { size: 20 },
        ),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [80, 4000, 900, 2200, 2200],
          rows: [
            new TableRow({
              children: [
                createCell('No', 80, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Task', 4000, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Jam', 900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Normal (Rp 250k)', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Khusus (Rp 200k)', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('1', 80),
                createCell('Code review & refactor', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('2', 80),
                createCell('Bug fix & optimization', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('3', 80),
                createCell('Email service (SMTP/SendGrid)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('4', 80),
                createCell('Push notification (FCM)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('5', 80),
                createCell('Missing API endpoints', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('6', 80),
                createCell('API documentation & Swagger', 4000),
                createCell('8', 900),
                createCell('Rp 2.000.000', 2200),
                createCell('Rp 1.600.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('7', 80),
                createCell('Unit testing (services)', 4000),
                createCell('32', 900),
                createCell('Rp 8.000.000', 2200),
                createCell('Rp 6.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('8', 80),
                createCell('Integration testing (end-to-end)', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('9', 80),
                createCell('Security audit & rate limiting', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('10', 80),
                createCell('Final deployment & server config', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80, { shading: 'E7E6E6' }),
                createCell('Subtotal Backend', 4000, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('180', 900, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 45.000.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 36.000.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // 2.2 Web
        new Paragraph({ spacing: { before: 300 } }),
        subHeader('B. Web Application — React (388 jam)'),
        bodyText('Interface untuk Admin, HRD, Manager, dan Atasan.', {
          size: 20,
        }),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [80, 4000, 900, 2200, 2200],
          rows: [
            new TableRow({
              children: [
                createCell('No', 80, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Task', 4000, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Jam', 900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Normal', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Khusus', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('1', 80),
                createCell('Project setup (React, routing, auth)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('2', 80),
                createCell('Design system & component library', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('3', 80),
                createCell('Login & authentication flow', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('4', 80),
                createCell('Dashboard admin (charts, stats)', 4000),
                createCell('32', 900),
                createCell('Rp 8.000.000', 2200),
                createCell('Rp 6.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('5', 80),
                createCell('Employee management (CRUD, filter)', 4000),
                createCell('40', 900),
                createCell('Rp 10.000.000', 2200),
                createCell('Rp 8.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('6', 80),
                createCell('Attendance module (list, detail)', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('7', 80),
                createCell('Leave request (form, list)', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('8', 80),
                createCell('Time off request', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('9', 80),
                createCell('Approval center (supervisor)', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('10', 80),
                createCell('Approval center (manager)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('11', 80),
                createCell('Payroll (input, calculation)', 4000),
                createCell('32', 900),
                createCell('Rp 8.000.000', 2200),
                createCell('Rp 6.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('12', 80),
                createCell('Payslip viewer & PDF export', 4000),
                createCell('20', 900),
                createCell('Rp 5.000.000', 2200),
                createCell('Rp 4.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('13', 80),
                createCell('Work schedule management', 4000),
                createCell('20', 900),
                createCell('Rp 5.000.000', 2200),
                createCell('Rp 4.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('14', 80),
                createCell('Report & Excel export', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('15', 80),
                createCell('User management & roles', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('16', 80),
                createCell('Responsive design', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('17', 80),
                createCell('Testing & bug fix web', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80, { shading: 'E7E6E6' }),
                createCell('Subtotal Web', 4000, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('388', 900, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 97.000.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 77.600.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // 2.3 Mobile
        new Paragraph({ spacing: { before: 300 } }),
        subHeader('C. Mobile Application — Flutter/React Native (312 jam)'),
        bodyText('Aplikasi Android & iOS untuk karyawan.', { size: 20 }),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [80, 4000, 900, 2200, 2200],
          rows: [
            new TableRow({
              children: [
                createCell('No', 80, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Task', 4000, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Jam', 900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Normal', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Khusus', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('1', 80),
                createCell('Project setup (Flutter/RN)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('2', 80),
                createCell('Auth & session management', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('3', 80),
                createCell('Home dashboard', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('4', 80),
                createCell('Clock-in with selfie + GPS', 4000),
                createCell('32', 900),
                createCell('Rp 8.000.000', 2200),
                createCell('Rp 6.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('5', 80),
                createCell('Clock-out with selfie + GPS', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('6', 80),
                createCell('Attendance history & detail', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('7', 80),
                createCell('Leave request form', 4000),
                createCell('20', 900),
                createCell('Rp 5.000.000', 2200),
                createCell('Rp 4.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('8', 80),
                createCell('Time off request form', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('9', 80),
                createCell('View payslip (PDF viewer)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('10', 80),
                createCell('Notification list & detail', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('11', 80),
                createCell('Profile & settings', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('12', 80),
                createCell('Push notification (FCM)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('13', 80),
                createCell('Offline mode (cache)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('14', 80),
                createCell('Testing Android', 4000),
                createCell('20', 900),
                createCell('Rp 5.000.000', 2200),
                createCell('Rp 4.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('15', 80),
                createCell('Testing iOS', 4000),
                createCell('20', 900),
                createCell('Rp 5.000.000', 2200),
                createCell('Rp 4.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('16', 80),
                createCell('Deploy to Play Store', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('17', 80),
                createCell('Deploy to App Store', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80, { shading: 'E7E6E6' }),
                createCell('Subtotal Mobile', 4000, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('312', 900, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 78.000.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 62.400.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // 2.4 Design
        new Paragraph({ spacing: { before: 300 } }),
        subHeader('D. UI/UX Design — Figma (172 jam)'),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [80, 4000, 900, 2200, 2200],
          rows: [
            new TableRow({
              children: [
                createCell('No', 80, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Task', 4000, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Jam', 900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Normal', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Khusus', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('1', 80),
                createCell('User research & requirement', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('2', 80),
                createCell('Wireframe web', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('3', 80),
                createCell('Wireframe mobile', 4000),
                createCell('20', 900),
                createCell('Rp 5.000.000', 2200),
                createCell('Rp 4.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('4', 80),
                createCell('High-fidelity design web', 4000),
                createCell('40', 900),
                createCell('Rp 10.000.000', 2200),
                createCell('Rp 8.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('5', 80),
                createCell('High-fidelity design mobile', 4000),
                createCell('32', 900),
                createCell('Rp 8.000.000', 2200),
                createCell('Rp 6.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('6', 80),
                createCell('Design system', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('7', 80),
                createCell('Prototype & user flow', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80, { shading: 'E7E6E6' }),
                createCell('Subtotal Design', 4000, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('172', 900, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 43.000.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 34.400.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // 2.5 QA
        new Paragraph({ spacing: { before: 300 } }),
        subHeader('E. QA & Testing (128 jam)'),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [80, 4000, 900, 2200, 2200],
          rows: [
            new TableRow({
              children: [
                createCell('No', 80, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Task', 4000, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Jam', 900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Normal', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Khusus', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('1', 80),
                createCell('Test plan & test case', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('2', 80),
                createCell('Functional testing (web)', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('3', 80),
                createCell('Functional testing (mobile)', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('4', 80),
                createCell('API testing (Postman)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('5', 80),
                createCell('UAT with client (2 rounds)', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('6', 80),
                createCell('Bug fix & retest', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80, { shading: 'E7E6E6' }),
                createCell('Subtotal QA', 4000, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('128', 900, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 32.000.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 25.600.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // 2.6 DevOps
        new Paragraph({ spacing: { before: 300 } }),
        subHeader('F. DevOps & Deployment (84 jam)'),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [80, 4000, 900, 2200, 2200],
          rows: [
            new TableRow({
              children: [
                createCell('No', 80, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Task', 4000, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Jam', 900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Normal', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Khusus', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('1', 80),
                createCell('Server provisioning (VPS/Cloud)', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('2', 80),
                createCell('Database setup & migration', 4000),
                createCell('8', 900),
                createCell('Rp 2.000.000', 2200),
                createCell('Rp 1.600.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('3', 80),
                createCell('CI/CD pipeline (GitHub Actions)', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('4', 80),
                createCell('Domain & SSL configuration', 4000),
                createCell('4', 900),
                createCell('Rp 1.000.000', 2200),
                createCell('Rp 800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('5', 80),
                createCell('Backup & monitoring', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('6', 80),
                createCell('Load testing & optimization', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('7', 80),
                createCell('Go-live deployment', 4000),
                createCell('8', 900),
                createCell('Rp 2.000.000', 2200),
                createCell('Rp 1.600.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('8', 80),
                createCell('Post-launch monitoring (1 minggu)', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80, { shading: 'E7E6E6' }),
                createCell('Subtotal DevOps', 4000, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('84', 900, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 21.000.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 16.800.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // 2.7 PM
        new Paragraph({ spacing: { before: 300 } }),
        subHeader('G. Project Management & Documentation (96 jam)'),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [80, 4000, 900, 2200, 2200],
          rows: [
            new TableRow({
              children: [
                createCell('No', 80, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Task', 4000, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Jam', 900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Normal', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Khusus', 2200, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('1', 80),
                createCell('Project planning & timeline', 4000),
                createCell('12', 900),
                createCell('Rp 3.000.000', 2200),
                createCell('Rp 2.400.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('2', 80),
                createCell('Weekly meeting & reporting', 4000),
                createCell('24', 900),
                createCell('Rp 6.000.000', 2200),
                createCell('Rp 4.800.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('3', 80),
                createCell('Technical documentation', 4000),
                createCell('16', 900),
                createCell('Rp 4.000.000', 2200),
                createCell('Rp 3.200.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('4', 80),
                createCell('User manual (Indonesia)', 4000),
                createCell('20', 900),
                createCell('Rp 5.000.000', 2200),
                createCell('Rp 4.000.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('5', 80),
                createCell('Training #1 (Admin & HRD)', 4000),
                createCell('8', 900),
                createCell('Rp 2.000.000', 2200),
                createCell('Rp 1.600.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('6', 80),
                createCell('Training #2 (Karyawan)', 4000),
                createCell('8', 900),
                createCell('Rp 2.000.000', 2200),
                createCell('Rp 1.600.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('7', 80),
                createCell('Handover & knowledge transfer', 4000),
                createCell('8', 900),
                createCell('Rp 2.000.000', 2200),
                createCell('Rp 1.600.000', 2200),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80, { shading: 'E7E6E6' }),
                createCell('Subtotal PM & Docs', 4000, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('96', 900, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 24.000.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 19.200.000', 2200, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // REKAPITULASI PHASE 1
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Rekapitulasi Phase 1',
              bold: true,
              size: 30,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [3500, 1500, 2400, 2680],
          rows: [
            new TableRow({
              children: [
                createCell('Komponen', 3500, { bold: true, shading: '2E5090' }),
                createCell('Jam', 1500, { bold: true, shading: '2E5090' }),
                createCell('Normal (Rp 250k)', 2400, {
                  bold: true,
                  shading: '2E5090',
                }),
                createCell('Khusus (Rp 200k)', 2680, {
                  bold: true,
                  shading: '2E5090',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Backend API', 3500),
                createCell('180', 1500),
                createCell('Rp 45.000.000', 2400),
                createCell('Rp 36.000.000', 2680),
              ],
            }),
            new TableRow({
              children: [
                createCell('Web Application', 3500),
                createCell('388', 1500),
                createCell('Rp 97.000.000', 2400),
                createCell('Rp 77.600.000', 2680),
              ],
            }),
            new TableRow({
              children: [
                createCell('Mobile Application', 3500),
                createCell('312', 1500),
                createCell('Rp 78.000.000', 2400),
                createCell('Rp 62.400.000', 2680),
              ],
            }),
            new TableRow({
              children: [
                createCell('UI/UX Design', 3500),
                createCell('172', 1500),
                createCell('Rp 43.000.000', 2400),
                createCell('Rp 34.400.000', 2680),
              ],
            }),
            new TableRow({
              children: [
                createCell('QA & Testing', 3500),
                createCell('128', 1500),
                createCell('Rp 32.000.000', 2400),
                createCell('Rp 25.600.000', 2680),
              ],
            }),
            new TableRow({
              children: [
                createCell('DevOps & Deploy', 3500),
                createCell('84', 1500),
                createCell('Rp 21.000.000', 2400),
                createCell('Rp 16.800.000', 2680),
              ],
            }),
            new TableRow({
              children: [
                createCell('PM & Documentation', 3500),
                createCell('96', 1500),
                createCell('Rp 24.000.000', 2400),
                createCell('Rp 19.200.000', 2680),
              ],
            }),
            new TableRow({
              children: [
                createCell('SUBTOTAL', 3500, { bold: true, shading: 'D5E8F0' }),
                createCell('1.360', 1500, { bold: true, shading: 'D5E8F0' }),
                createCell('Rp 340.000.000', 2400, {
                  bold: true,
                  shading: 'D5E8F0',
                }),
                createCell('Rp 272.000.000', 2680, {
                  bold: true,
                  shading: 'D5E8F0',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Buffer 15% (risiko & revisi)', 3500),
                createCell('—', 1500),
                createCell('Rp 51.000.000', 2400),
                createCell('Rp 40.800.000', 2680),
              ],
            }),
            new TableRow({
              children: [
                createCell('TOTAL (sebelum optimasi)', 3500, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('', 1500, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 391.000.000', 2400, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 312.800.000', 2680, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 200 } }),
        bodyText(
          'Setelah value engineering (mengoptimalkan task karena backend sudah jadi dan menggunakan komponen reusable):',
        ),

        new Table({
          width: { size: 7000, type: WidthType.DXA },
          columnWidths: [3500, 3500],
          rows: [
            new TableRow({
              children: [
                createCell('Harga Normal Phase 1', 3500, {
                  bold: true,
                  shading: 'D5E8F0',
                }),
                createCell('Rp 275.000.000', 3500, {
                  bold: true,
                  shading: 'D5E8F0',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Harga Khusus Phase 1', 3500, {
                  bold: true,
                  shading: 'C5E0B4',
                }),
                createCell('Rp 220.000.000', 3500, {
                  bold: true,
                  shading: 'C5E0B4',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Hemat', 3500, { bold: true }),
                createCell('Rp 55.000.000 (20%)', 3500, { bold: true }),
              ],
            }),
          ],
        }),

        // Phase 2
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Breakdown Phase 2 — Enhancement',
              bold: true,
              size: 28,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        bodyText(
          'Target: 2-3 bulan setelah Phase 1 stabil. Scope: Fitur advanced bersifat optional.',
        ),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [80, 3800, 900, 2400, 2900],
          rows: [
            new TableRow({
              children: [
                createCell('No', 80, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Modul', 3800, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Jam', 900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Normal (Rp 250k)', 2400, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
                createCell('Khusus (Rp 200k)', 2900, {
                  bold: true,
                  shading: '4472C4',
                  fontSize: 18,
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('1', 80),
                createCell('Advanced Payroll (PPh 21 TER, BPJS)', 3800),
                createCell('80', 900),
                createCell('Rp 20.000.000', 2400),
                createCell('Rp 16.000.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('2', 80),
                createCell('Overtime (perhitungan kompleks)', 3800),
                createCell('64', 900),
                createCell('Rp 16.000.000', 2400),
                createCell('Rp 12.800.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('3', 80),
                createCell('Recruitment (job portal, tracking)', 3800),
                createCell('72', 900),
                createCell('Rp 18.000.000', 2400),
                createCell('Rp 14.400.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('4', 80),
                createCell('Reimbursement (claim, upload)', 3800),
                createCell('40', 900),
                createCell('Rp 10.000.000', 2400),
                createCell('Rp 8.000.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('5', 80),
                createCell('Analytics Dashboard', 3800),
                createCell('48', 900),
                createCell('Rp 12.000.000', 2400),
                createCell('Rp 9.600.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('6', 80),
                createCell('Push Notification (FCM)', 3800),
                createCell('32', 900),
                createCell('Rp 8.000.000', 2400),
                createCell('Rp 6.400.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('7', 80),
                createCell('Multi-company support', 3800),
                createCell('40', 900),
                createCell('Rp 10.000.000', 2400),
                createCell('Rp 8.000.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('8', 80),
                createCell('Advanced Report', 3800),
                createCell('32', 900),
                createCell('Rp 8.000.000', 2400),
                createCell('Rp 6.400.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80),
                createCell('Buffer 15%', 3800),
                createCell('', 900),
                createCell('Rp 15.600.000', 2400),
                createCell('Rp 12.480.000', 2900),
              ],
            }),
            new TableRow({
              children: [
                createCell('', 80, { shading: 'E7E6E6' }),
                createCell('TOTAL Phase 2', 3800, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('408', 900, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 117.600.000', 2400, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('Rp 94.080.000', 2900, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // GRAND TOTAL
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Grand Total Full Package',
              bold: true,
              size: 32,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),

        new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [4500, 4500],
          rows: [
            new TableRow({
              children: [
                createCell('Keterangan', 4500, {
                  bold: true,
                  shading: '2E5090',
                }),
                createCell('Harga', 4500, { bold: true, shading: '2E5090' }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Phase 1 (MVP)', 4500),
                createCell('Rp 220.000.000', 4500),
              ],
            }),
            new TableRow({
              children: [
                createCell('Phase 2 (Enhancement)', 4500),
                createCell('Rp 140.000.000', 4500),
              ],
            }),
            new TableRow({
              children: [
                createCell('SUBTOTAL', 4500, { bold: true }),
                createCell('Rp 360.000.000', 4500, { bold: true }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Diskon Full Package', 4500, { bold: true }),
                createCell('- Rp 20.000.000', 4500, { bold: true }),
              ],
            }),
            new TableRow({
              children: [
                createCell('GRAND TOTAL', 4500, {
                  bold: true,
                  shading: 'C5E0B4',
                }),
                createCell('Rp 340.000.000', 4500, {
                  bold: true,
                  shading: 'C5E0B4',
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 300 } }),
        bodyText(
          'Harga ini adalah rate khusus untuk projek pertama. Ke depannya, untuk maintenance atau fitur tambahan, rate akan kembali ke normal Rp 250.000 per jam.',
        ),

        // VALIDASI PASAR
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Validasi Pasar',
              bold: true,
              size: 28,
              font: 'Arial',
              color: '2E5090',
            }),
          ],
        }),
        bodyText(
          'Perbandingan dengan platform freelance dan software house di Indonesia:',
        ),

        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [3500, 3000, 3580],
          rows: [
            new TableRow({
              children: [
                createCell('Platform/Vendor', 3500, {
                  bold: true,
                  shading: '4472C4',
                }),
                createCell('Rate/Jam', 3000, { bold: true, shading: '4472C4' }),
                createCell('Keterangan', 3580, {
                  bold: true,
                  shading: '4472C4',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Upwork (Global)', 3500),
                createCell('$30-80/jam', 3000),
                createCell('Rp 450k — 1,2jt/jam', 3580),
              ],
            }),
            new TableRow({
              children: [
                createCell('Toptal', 3500),
                createCell('$60-150/jam', 3000),
                createCell('Rp 900k — 2,25jt/jam', 3580),
              ],
            }),
            new TableRow({
              children: [
                createCell('Sribu.com (Lokal)', 3500),
                createCell('Rp 150k-400k/jam', 3000),
                createCell('Tergantung kompleksitas', 3580),
              ],
            }),
            new TableRow({
              children: [
                createCell('Software House Jakarta', 3500),
                createCell('Rp 400k-800k/jam', 3000),
                createCell('Include overhead kantor', 3580),
              ],
            }),
            new TableRow({
              children: [
                createCell('Rate Kami (Khusus)', 3500, {
                  bold: true,
                  shading: 'C5E0B4',
                }),
                createCell('Rp 200.000/jam', 3000, {
                  bold: true,
                  shading: 'C5E0B4',
                }),
                createCell('Di bawah pasaran', 3580, {
                  bold: true,
                  shading: 'C5E0B4',
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: '"Harga ini bukan dibuat-buat. Setiap rupiah sudah diperhitungkan berdasarkan jam kerja nyata yang dibutuhkan untuk membangun sistem HRIS yang handal."',
              size: 24,
              font: 'Arial',
              italics: true,
              color: '666666',
            }),
          ],
        }),

        // KONTAK
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeader('11. Kontak & Next Steps'),
        bodyText(
          'Kami siap untuk diskusi lebih lanjut mengenai kebutuhan spesifik PT Samugara. Silakan hubungi kami untuk:',
        ),
        bodyText('Presentasi demo sistem (30-45 menit)', { bullet: true }),
        bodyText('Diskusi detail requirement & customization', {
          bullet: true,
        }),
        bodyText('Site visit ke kantor PT Samugara (jika diperlukan)', {
          bullet: true,
        }),

        new Paragraph({ spacing: { before: 300 } }),
        new Table({
          width: { size: 6000, type: WidthType.DXA },
          columnWidths: [2500, 3500],
          rows: [
            new TableRow({
              children: [
                createCell('Nama', 2500, { bold: true, shading: 'E7E6E6' }),
                createCell('[Nama Anda]', 3500),
              ],
            }),
            new TableRow({
              children: [
                createCell('Email', 2500, { bold: true, shading: 'E7E6E6' }),
                createCell('[email@anda.com]', 3500),
              ],
            }),
            new TableRow({
              children: [
                createCell('Telepon/WhatsApp', 2500, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('[0812-xxxx-xxxx]', 3500),
              ],
            }),
            new TableRow({
              children: [
                createCell('Website/Portfolio', 2500, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
                createCell('[www.anda.com]', 3500),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Terima kasih atas kesempatan ini. Kami berharap dapat bekerja sama dengan PT Samugara.',
              size: 24,
              font: 'Arial',
              italics: true,
              color: '666666',
            }),
          ],
        }),
      ],
    },
  ],
});

// Generate the document
Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync('meeting/PROPOSAL_HRIS_SAMUGARA_v2.docx', buffer);
    console.log(
      '✅ Proposal v2 berhasil dibuat: meeting/PROPOSAL_HRIS_SAMUGARA_v2.docx',
    );
  })
  .catch((err) => {
    console.error('❌ Error generating document:', err);
  });
