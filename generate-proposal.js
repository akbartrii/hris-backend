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
  const { bold = false, shading = null, colSpan = 1 } = options;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    columnSpan: colSpan,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, font: 'Arial', size: 22 })],
      }),
    ],
  });
}

// Helper function for section headers
function sectionHeader(text) {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        font: 'Arial',
        color: '2E5090',
      }),
    ],
  });
}

// Helper function for body text
function bodyText(text, options = {}) {
  const { bold = false, bullet = false } = options;
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    numbering: bullet ? { reference: 'bullets', level: 0 } : undefined,
    children: [new TextRun({ text, bold, size: 22, font: 'Arial' })],
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
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
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
        new Paragraph({ spacing: { before: 800 } }),
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
        new Paragraph({ spacing: { before: 1200 } }),
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

        // ===== SECTION 1: EXECUTIVE SUMMARY =====
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

        // ===== SECTION 2: LATAR BELAKANG =====
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeader('2. Latar Belakang & Analisis Masalah'),
        bodyText(
          'Berdasarkan diskusi awal dan analisis kebutuhan, teridentifikasi beberapa tantangan utama dalam pengelolaan HR di PT Samugara:',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3000, 6360],
          rows: [
            new TableRow({
              children: [
                createCell('Area', 3000, { bold: true, shading: '2E5090' }),
                createCell('Tantangan', 6360, {
                  bold: true,
                  shading: '2E5090',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Absensi', 3000),
                createCell(
                  'Proses absensi manual rentan terhadap kesalahan input, sulit memvalidasi kehadiran di lokasi, dan memakan waktu untuk rekonsiliasi',
                  6360,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Cuti & Izin', 3000),
                createCell(
                  'Pengajuan cuti melalui form fisik/verbal sulit dilacak, sering terjadi kehilangan dokumentasi, dan approval membutuhkan waktu lama',
                  6360,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Payroll', 3000),
                createCell(
                  'Perhitungan gaji manual memakan waktu 3-5 hari per bulan, rentan kesalahan PPh 21 dan BPJS, dan sulit menghasilkan slip gaji yang konsisten',
                  6360,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Lembur', 3000),
                createCell(
                  'Perhitungan jam lembur dengan aturan kompleks (pembulatan, uang makan) sering menimbulkan dispute dengan karyawan',
                  6360,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Reporting', 3000),
                createCell(
                  'Laporan HR harus disusun manual di Excel, membutuhkan waktu berjam-jam dan sering tidak up-to-date',
                  6360,
                ),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 300 } }),
        bodyText(
          'Dampak dari tantangan-tantangan ini tidak hanya pada efisiensi operasional, tetapi juga pada kepuasan karyawan dan compliance terhadap regulasi ketenagakerjaan.',
        ),

        // ===== SECTION 3: SOLUSI =====
        sectionHeader('3. Solusi yang Ditawarkan'),
        bodyText(
          'Kami menawarkan solusi HRIS end-to-end yang mencakup tiga komponen utama:',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2500, 6860],
          rows: [
            new TableRow({
              children: [
                createCell('Komponen', 2500, { bold: true, shading: '2E5090' }),
                createCell('Deskripsi', 6860, {
                  bold: true,
                  shading: '2E5090',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Backend API', 2500, { bold: true }),
                createCell(
                  'Sistem inti berbasis NestJS + TypeScript dengan 17+ modul. Menangani business logic, perhitungan payroll, approval workflow, dan integrasi database. Siap digunakan.',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Web Application', 2500, { bold: true }),
                createCell(
                  'Interface berbasis React untuk Admin, HRD, Manager, dan Atasan. Menyediakan dashboard, manajemen karyawan, approval center, payroll management, dan reporting.',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Mobile Application', 2500, { bold: true }),
                createCell(
                  'Aplikasi Android & iOS untuk karyawan. Fitur utama: absensi dengan selfie + GPS, pengajuan cuti/izin, lihat slip gaji, dan notifikasi approval.',
                  6860,
                ),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 300 } }),
        bodyText(
          'Sistem ini akan di-deploy pada infrastruktur cloud yang aman, dengan backup otomatis dan dukungan teknis pasca go-live.',
        ),

        // ===== SECTION 4: SCOPE PHASE 1 =====
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeader('4. Scope Phase 1 — MVP HRIS (Go-Live 3-4 Bulan)'),
        bodyText(
          'Phase 1 difokuskan pada fitur inti yang paling urgent untuk operasional HR harian. Target go-live: 3-4 bulan dari kick-off.',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2500, 6860],
          rows: [
            new TableRow({
              children: [
                createCell('Modul', 2500, { bold: true, shading: '4472C4' }),
                createCell('Fitur Detail', 6860, {
                  bold: true,
                  shading: '4472C4',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Attendance', 2500, { bold: true }),
                createCell(
                  'Clock in/out dengan selfie + GPS, validasi radius lokasi, koreksi absensi dengan approval 2-level, auto-mark absent, perhitungan keterlambatan & pulang cepat',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Leave & Time Off', 2500, { bold: true }),
                createCell(
                  'Cuti tahunan (12 hari), cuti umroh (30 hari), izin terlambat/pulang cepat/sakit, tracking saldo real-time, approval workflow',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Employee Mgmt', 2500, { bold: true }),
                createCell(
                  'Data karyawan lengkap, penjadwalan kerja & shift (termasuk security 3 shift), penugasan lokasi, hierarki atasan-bawahan',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Basic Payroll', 2500, { bold: true }),
                createCell(
                  'Slip gaji digital, perhitungan prorate untuk karyawan baru/resign, THR sederhana, export Excel, PDF payslip',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Work Schedule', 2500, { bold: true }),
                createCell(
                  'Jadwal normal & Ramadhan, rotasi shift, integrasi hari libur nasional, penjadwalan otomatis',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Approval', 2500, { bold: true }),
                createCell(
                  'Multi-level approval (Supervisor → Manager HRGA), notifikasi in-app, audit trail perubahan',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('User Access', 2500, { bold: true }),
                createCell(
                  '6 role: Karyawan, Atasan, Manager HRGA, HRD, Admin, Super Admin dengan permission berbeda',
                  6860,
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

        // ===== SECTION 5: SCOPE PHASE 2 =====
        sectionHeader(
          '5. Scope Phase 2 — Enhancement (2-3 Bulan setelah Phase 1)',
        ),
        bodyText(
          'Phase 2 adalah pengembangan fitur advanced yang dapat diambil setelah Phase 1 stabil. Sifatnya opsional dan fleksibel sesuai kebutuhan.',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2500, 6860],
          rows: [
            new TableRow({
              children: [
                createCell('Modul', 2500, { bold: true, shading: '4472C4' }),
                createCell('Fitur Detail', 6860, {
                  bold: true,
                  shading: '4472C4',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Advanced Payroll', 2500, { bold: true }),
                createCell(
                  'PPh 21 TER otomatis (bukan dummy), BPJS otomatis (Kesehatan, TK, JP), perhitungan kompleks, batch generate payslip',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Overtime', 2500, { bold: true }),
                createCell(
                  'Rate (Gaji Pokok + Tunjangan)/173, pembulatan jam khusus, uang makan lembur berbasis hari & jam, approval workflow',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Recruitment', 2500, { bold: true }),
                createCell(
                  'Job portal publik dengan slug, tracking pelamar, status lolos/tidak lolos, auto-email rejection',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Push Notification', 2500, { bold: true }),
                createCell(
                  'FCM integration untuk notifikasi approval, reminder absensi, pengumuman perusahaan',
                  6860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Analytics', 2500, { bold: true }),
                createCell(
                  'Dashboard dengan grafik kehadiran, statistik lembur, trend cuti, report advanced (PDF + Excel)',
                  6860,
                ),
              ],
            }),
          ],
        }),

        // ===== SECTION 6: 3 MODEL HARGA =====
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
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({
              children: [
                createCell('Investasi Phase 1', 3500),
                createCell('Rp 275.000.000', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Investasi Phase 2', 3500),
                createCell('Rp 175.000.000 (jika diambil)', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Full Package (hemat)', 3500),
                createCell('Rp 425.000.000 (hemat Rp 25 juta)', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Termin', 3500),
                createCell(
                  '40% di awal → 30% setelah demo → 30% setelah go-live',
                  5860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Include', 3500),
                createCell(
                  'Source code, deployment, training, dokumentasi, garansi 3 bulan',
                  5860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Exclude', 3500),
                createCell(
                  'Server/cloud (klien siapkan), maintenance tahunan',
                  5860,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Maintenance (opsional)', 3500),
                createCell(
                  'Rp 30.000.000/tahun — update regulasi, bug fix, support',
                  5860,
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
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({
              children: [
                createCell('Setup Fee (sekali)', 3500),
                createCell('Rp 100.000.000', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Biaya Bulanan', 3500),
                createCell('Rp 8.000 — Rp 15.000 per karyawan/bulan', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Contoh: 500 karyawan', 3500),
                createCell('Rp 5.000.000 — Rp 7.500.000/bulan', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Contoh: 1.000 karyawan', 3500),
                createCell('Rp 8.000.000 — Rp 15.000.000/bulan', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Minimum Commitment', 3500),
                createCell('12 bulan', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Include', 3500),
                createCell(
                  'Hosting, backup, update regulasi, maintenance, support jam kerja',
                  5860,
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
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({
              children: [
                createCell('Discovery & Analysis', 3500),
                createCell('Rp 25.000.000 (2-3 minggu)', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('UI/UX Design', 3500),
                createCell('Rp 50.000.000 (4-6 minggu)', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Development', 3500),
                createCell('Rp 350.000.000 (4-6 bulan)', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Testing & UAT', 3500),
                createCell('Rp 50.000.000 (1-2 bulan)', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('Deployment', 3500),
                createCell('Rp 25.000.000 (2 minggu)', 5860),
              ],
            }),
            new TableRow({
              children: [
                createCell('TOTAL', 3500, { bold: true, shading: 'E7E6E6' }),
                createCell('Rp 500.000.000 (6-8 bulan)', 5860, {
                  bold: true,
                  shading: 'E7E6E6',
                }),
              ],
            }),
          ],
        }),

        // ===== SECTION 7: COMPARISON =====
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeader('7. Perbandingan dengan Solusi HRIS di Pasar'),
        bodyText(
          'Berikut perbandingan dengan solusi HRIS yang tersedia di pasaran Indonesia:',
        ),

        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 1800, 1800, 1800, 1760],
          rows: [
            new TableRow({
              children: [
                createCell('Aspek', 2200, { bold: true, shading: '2E5090' }),
                createCell('Talenta', 1800, { bold: true, shading: '2E5090' }),
                createCell('Gadjian', 1800, { bold: true, shading: '2E5090' }),
                createCell('Sleekr', 1800, { bold: true, shading: '2E5090' }),
                createCell('HRIS Kami', 1760, {
                  bold: true,
                  shading: '2E5090',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Harga (1000 org/tahun)', 2200),
                createCell('Rp 150-300jt', 1800),
                createCell('Rp 100-200jt', 1800),
                createCell('Rp 120-250jt', 1800),
                createCell('Rp 96-120jt', 1760, { bold: true }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Beli Putus', 2200),
                createCell('Tidak tersedia', 1800),
                createCell('Tidak tersedia', 1800),
                createCell('Tidak tersedia', 1800),
                createCell('Tersedia', 1760, { bold: true }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Custom Workflow', 2200),
                createCell('Terbatas', 1800),
                createCell('Terbatas', 1800),
                createCell('Terbatas', 1800),
                createCell('Full Custom', 1760, { bold: true }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Data Ownership', 2200),
                createCell('Vendor', 1800),
                createCell('Vendor', 1800),
                createCell('Vendor', 1800),
                createCell('100% Klien', 1760, { bold: true }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Setup Time', 2200),
                createCell('1-2 bulan', 1800),
                createCell('1-2 bulan', 1800),
                createCell('1-2 bulan', 1800),
                createCell('2-3 minggu', 1760, { bold: true }),
              ],
            }),
          ],
        }),

        // ===== SECTION 8: TIMELINE =====
        new Paragraph({ spacing: { before: 400 } }),
        sectionHeader('8. Timeline Implementasi Phase 1'),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1500, 2500, 5360],
          rows: [
            new TableRow({
              children: [
                createCell('Bulan', 1500, { bold: true, shading: '4472C4' }),
                createCell('Fase', 2500, { bold: true, shading: '4472C4' }),
                createCell('Deliverable', 5360, {
                  bold: true,
                  shading: '4472C4',
                }),
              ],
            }),
            new TableRow({
              children: [
                createCell('Bulan 1', 1500, { bold: true }),
                createCell('UI/UX Design & Setup', 2500),
                createCell(
                  'Wireframe web & mobile, design system, environment setup',
                  5360,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Bulan 2', 1500, { bold: true }),
                createCell('Web Development', 2500),
                createCell(
                  'Dashboard, employee management, approval center, report',
                  5360,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Bulan 3', 1500, { bold: true }),
                createCell('Mobile Development', 2500),
                createCell(
                  'Absensi selfie+GPS, pengajuan cuti/izin, slip gaji, notifikasi',
                  5360,
                ),
              ],
            }),
            new TableRow({
              children: [
                createCell('Bulan 4', 1500, { bold: true }),
                createCell('Integration & Go-Live', 2500),
                createCell(
                  'End-to-end testing, UAT, deployment production, training',
                  5360,
                ),
              ],
            }),
          ],
        }),

        // ===== SECTION 9: TERMS =====
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeader('9. Syarat & Ketentuan'),

        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: 'Pembayaran',
              bold: true,
              size: 24,
              font: 'Arial',
            }),
          ],
        }),
        bodyText(
          'Termin pembayaran dapat disesuaikan dengan model yang dipilih. Untuk model Beli Putus, struktur yang disarankan:',
        ),
        bodyText(
          'Termin 1 (40%): Dibayar di awal kontrak sebagai down payment',
          { bullet: true },
        ),
        bodyText(
          'Termin 2 (30%): Dibayar setelah demo sistem & user acceptance test',
          { bullet: true },
        ),
        bodyText('Termin 3 (30%): Dibayar setelah go-live + 2 minggu stabil', {
          bullet: true,
        }),

        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: 'Garansi',
              bold: true,
              size: 24,
              font: 'Arial',
            }),
          ],
        }),
        bodyText(
          'Bug fix gratis selama 3 bulan setelah go-live untuk model Beli Putus. Untuk model SaaS, maintenance & bug fix sudah termasuk dalam biaya bulanan.',
        ),

        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: 'Kepemilikan',
              bold: true,
              size: 24,
              font: 'Arial',
            }),
          ],
        }),
        bodyText(
          'Untuk model Beli Putus: source code, database schema, dan seluruh aset digital menjadi milik PT Samugara 100% setelah pembayaran lunas.',
        ),

        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: 'Kerahasiaan',
              bold: true,
              size: 24,
              font: 'Arial',
            }),
          ],
        }),
        bodyText(
          'Kami berkomitmen untuk menjaga kerahasiaan data perusahaan dan karyawan. NDA (Non-Disclosure Agreement) dapat ditandatangani jika diperlukan.',
        ),

        // ===== SECTION 10: CONTACT =====
        new Paragraph({ spacing: { before: 600 } }),
        sectionHeader('10. Kontak & Next Steps'),
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
    fs.writeFileSync('docs/PROPOSAL_HRIS_SAMUGARA.docx', buffer);
    console.log(
      '✅ Proposal berhasil dibuat: docs/PROPOSAL_HRIS_SAMUGARA.docx',
    );
  })
  .catch((err) => {
    console.error('❌ Error generating document:', err);
  });
