# Requirements Document: New HRIS Samugara — Admin & HR

## Overview
Aplikasi HRIS (Human Resource Information System) untuk PT Samugara — modul yang diakses oleh Admin, HR, dan Manager meliputi penggajian, THR, rekrutmen, manajemen karyawan, serta laporan.

---

## 1. Penggajian (Payroll)

### 1.1 Tanggal Pembayaran
- Gaji dibayarkan tanggal **30/31** setiap bulan (dibayarkan di bulan berjalan pada tanggal terakhir)

### 1.2 Komponen Gaji
**Penghasilan:**
- Gaji Pokok
- Uang Kehadiran / Uang Makan
- Uang Pulsa
- Uang Dinas
- Uang Lembur

**Potongan:**
- Potongan Kasbon
- Potongan BPJS Kesehatan dan Ketenagakerjaan
- Potongan PPh 21

### 1.3 Periode Cut Off
- **Gaji Pokok**: periode tanggal 1 s.d. 30
- **Uang Kehadiran, Uang Lembur**: cut off periode tanggal **26 s.d. 25**

### 1.4 Gaji Prorate
- Perhitungan gaji prorate untuk karyawan baru/resign di tengah bulan:
  ```
  Gaji Prorate = (Gaji Pokok + Tunjangan Tetap) / Hari Kerja Efektif × Hari Masuk
  ```
- Ada pilihan pembayaran BPJS: **dibayarkan perusahaan** atau **dipotong dari gaji karyawan**

---

## 2. THR (Tunjangan Hari Raya)
- Perhitungan THR mengikuti ketentuan yang berlaku
- Detail perhitungan dapat ditambahkan sesuai kebijakan perusahaan

---

## 3. Rekrutmen (Recruitment)

### 3.1 Fitur Job Portal
- Upload lowongan kerja (loker) seperti job portal
- Link loker bisa dibagikan ke umum untuk melamar pekerjaan
- Database pelamar terkumpul menjadi 1 sesuai posisi loker yang dilamar
- Tracking status pelamar: lolos / tidak lolos
- **Auto email penolakan** untuk pelamar yang tidak lolos

### 3.2 Alur Recruitment
1. Admin/HR upload loker
2. Pelamar apply via link publik
3. HR review & update status (lolos/tidak lolos)
4. Sistem kirim email otomatis jika ditolak

---

## 4. Hak Akses & Role

### 4.1 Role Pengguna
- **Karyawan**: mengajukan absensi, cuti, izin, melihat slip gaji
- **Atasan/SPV/Manager**: approval pengajuan bawahan, mengajukan lembur untuk bawahan
- **Admin**: mengelola data karyawan, bisa mengajukan/edit pengajuan karyawan jika ada kendala
- **Super Admin**: akses penuh termasuk edit pengajuan karyawan
- **HRD/HRGA**: rekap absensi, lembur, payroll

### 4.2 Akses Edit Admin & Super Admin
- Admin dan Super Admin **bisa mengajukan maupun edit pengajuan** dari karyawan
- Contoh kasus: Karyawan X tidak bisa mengajukan absensi karena error, maka atasan/admin/super admin dapat membuat atau mengedit pengajuan agar tetap terekap

---

## 5. Catatan & Kebutuhan Tambahan

### 5.1 Kebutuhan Teknis
- Aplikasi mobile-first untuk fitur absensi (selfie + GPS)
- Push notification untuk approval, pengingat absensi, dll.
- Integrasi GPS untuk validasi radius lokasi
- Sistem email otomatis untuk recruitment

### 5.2 Kebutuhan Laporan
- Rekap absensi harian/bulanan/tahunan
- Rekap lembur per karyawan
- Slip gaji digital
- Report cuti & sisa saldo cuti
- Report rekrutmen (jumlah pelamar, status, dll.)

### 5.3 Integrasi
- Integrasi dengan BPJS untuk perhitungan potongan
- Integrasi dengan sistem keuangan/accounting untuk payroll
- Kalender kerja (libur nasional, cuti bersama)

---

## 6. Mockup & UI/UX — Web App (Admin/HR/Manager)

- **Dashboard**: statistik kehadiran, pengajuan pending, grafik lembur
- **Manajemen Karyawan**: data karyawan, jadwal shift, lokasi kerja
- **Approval Center**: tabel pengajuan cuti, izin, lembur, koreksi absensi
- **Payroll**: input komponen gaji, generate slip gaji, rekap potongan
- **Recruitment**: daftar loker, pelamar, tracking status
- **Laporan**: export Excel/PDF untuk semua modul

---

*Dokumen ini merupakan bagian dari "New HRIS Samugara" yang difokuskan pada fitur Admin & HR.*
