# Requirements Document: New HRIS Samugara — Karyawan

## Overview
Aplikasi HRIS (Human Resource Information System) untuk PT Samugara — modul yang diakses oleh karyawan meliputi absensi, pengajuan cuti & izin, lembur, serta akses slip gaji.

---

## 1. Absensi (Attendance)

### 1.1 Fitur Utama
- **Mobile attendance** dengan fitur selfie (self-photo saat clock in/out)
- **Lokasi-based attendance**:
  - Sebagian lokasi fixed (ditentukan per karyawan/role)
  - Sebagian flexible (bisa dari mana saja, misal: dinas luar, WFH)
- **Radius lokasi**: 100 meter dari titik lokasi yang ditentukan
- **Clock In & Clock Out** wajib untuk terhitung sebagai kehadiran

### 1.2 Koreksi Absensi
- Karyawan bisa mengajukan koreksi absensi jika:
  - Salah absen
  - Lupa absen (clock in dan/atau clock out)
- Wajib disertai **alasan** pengajuan
- **Approval flow**: Atasan → Manager HRGA

### 1.3 Toleransi Keterlambatan
- Toleransi keterlambatan: **5 menit**
- Jika terlambat > 5 menit: dipotong **Rp 5.000 per jam**
- Karyawan yang **mengajukan izin datang terlambat** tidak dianggap telat
- Jika **tidak mengajukan izin** terlambat: maksimal 1 hari, otomatis dipotong Rp 5.000/jam

### 1.4 Aturan Uang Kehadiran
- Absensi wajib **lengkap** (clock in + clock out) untuk mendapatkan uang kehadiran
- Jika tidak ada/tidak lengkap = **0 (nol)**

---

## 2. Jam Kerja (Work Schedule)

### 2.1 Schedule Normal

| Schedule | Kode Shift | Jam Kerja | Istirahat | Hari Kerja | Notes |
|----------|-----------|-----------|-----------|------------|-------|
| Tegal Office | — | 08:00 – 17:00 | 12:00 – 13:00 | Senin – Jumat | Hari libur nasional = libur |
| Tegal Lapangan | — | 08:00 – 16:00 (Senin–Jumat)<br>08:00 – 14:00 (Sabtu) | 12:00 – 13:00 | Senin – Jumat<br>Sabtu | — |
| Tegal Security | Shift 1 | 07:00 – 15:00 | — | Senin – Minggu | Hari libur nasional = tidak libur |
| | Shift 2 | 15:00 – 23:00 | — | Senin – Minggu | — |
| | Shift 3 | 23:00 – 07:00 | — | Senin – Minggu | — |

- **Rotasi Security**: Shift 1 (ganti 07:00–15:00 jaga), Shift 2 (ganti 15:00–23:00 jaga), Shift 3 (ganti 23:00–07:00 jaga)

### 2.2 Schedule Khusus Ramadhan

| Schedule | Kode Shift | Jam Kerja | Istirahat | Hari Kerja | Notes |
|----------|-----------|-----------|-----------|------------|-------|
| Tegal Office | — | 08:00 – 16:00 | 12:00 – 13:00 | Senin – Jumat | Hari libur nasional = libur |
| Tegal Lapangan | — | 08:00 – 15:00 (Senin–Jumat)<br>08:00 – 13:00 (Sabtu) | 12:00 – 13:00 | Senin – Jumat<br>Sabtu | — |
| Tegal Security | Shift 1 | 07:00 – 15:00 | — | Senin – Minggu | Tidak ada perubahan |
| | Shift 2 | 15:00 – 23:00 | — | Senin – Minggu | — |
| | Shift 3 | 23:00 – 07:00 | — | Senin – Minggu | — |

**Note**: Jam kerja Ramadhan dipotong 1 jam lebih cepat dari jam pulang biasanya.

### 2.3 Aturan Security
- Security wajib mengajukan absen di **tanggal merah** (hari libur nasional/cuti bersama) karena ada perbedaan upah.

---

## 3. Cuti (Leave)

### 3.1 Cuti Tahunan
- **Saldo cuti**: 12 hari per tahun
- Reset otomatis menjadi **12 hari** di awal tahun tanpa pengurangan atau penambahan
- Jika cuti terpakai, saldo otomatis berkurang
- Jika saldo habis, karyawan **tidak dapat** mengajukan cuti
- Cuti didapat setelah **1 tahun masa kontrak**
- Cuti tahunan **tidak dikurangi** cuti bersama (karena cuti bersama bersifat tentatif)

### 3.2 Cuti Khusus / Cuti Wajib Pemerintah
- Sesuai ketentuan peraturan pemerintah yang berlaku

### 3.3 Cuti Umroh
- Tambahan cuti umroh: **1 bulan**

---

## 4. Time Off / Izin (Non-Cuti)
- Time off **bukan cuti** dan **tidak mengurangi saldo cuti**
- Kategori: izin datang terlambat, izin pulang cepat, izin tidak masuk (sakit, urusan penting, dll.)

---

## 5. Lembur (Overtime)

### 5.1 Rumus Perhitungan Lembur
```
Rate per jam = (Gaji Pokok + Tunjangan Tetap) / 173
```

### 5.2 Pembulatan Jam Lembur

| Durasi Lembur | Dihitung Sebagai |
|---------------|-----------------|
| 1 s.d. 30 menit | 0,5 jam |
| 1 menit s.d. 60 menit | 1 jam |
| 1 jam 15 menit | 1 jam |
| 1 jam 30 menit | 1,5 jam |
| 1 jam 45 menit | 1,5 jam |
| 1 jam 46 menit | 2 jam |

*(Pembulatan ke atas)*

### 5.3 Uang Makan Lembur

#### Hari Kerja (Senin – Jumat)
| Waktu Lembur | Uang Makan |
|-------------|------------|
| Sebelum jam kerja | Rp 10.000 |
| 16:00 – 20:00 | Rp 20.000 |
| 20:00 – 24:00 | Rp 10.000 |
| 24:00 – selesai | Rp 20.000 |

#### Hari Sabtu
| Waktu Lembur | Uang Makan |
|-------------|------------|
| Sebelum jam kerja | Rp 10.000 |
| 14:00 – 22:00 | Rp 6.000 |
| 18:00 – 22:00 | Rp 20.000 |
| 22:00 – selesai | Rp 10.000 |

#### Hari Libur Minggu & Hari Libur Nasional
| Waktu Lembur | Uang Makan |
|-------------|------------|
| Sebelum jam kerja | Rp 10.000 |
| 08:00 – 12:00 | Rp 10.000 |
| 13:00 – 17:00 | Rp 15.000 |
| 17:00 – 21:00 | Rp 20.000 |
| 24:00 – selesai | Rp 20.000 |

### 5.4 Alur Approval Lembur
```
Atasan/SPV/Manager mengajukan lembur → Manager ACC → HRD rekap
```
- **Pengajuan dilakukan oleh atasan**, tidak boleh dari karyawan
- Approval oleh **Manager**
- HRD melakukan rekap setelah di-approve

---

## 6. Slip Gaji
- Karyawan dapat **melihat dan mengunduh** slip gaji per periode melalui aplikasi mobile

---

## 7. Hak Akses & Role — Karyawan

### 7.1 Karyawan
- **Karyawan**: mengajukan absensi, cuti, izin, melihat slip gaji
- **Atasan/SPV/Manager**: approval pengajuan bawahan, mengajukan lembur untuk bawahan

---

## 8. Mockup & UI/UX — Mobile App (Karyawan)

- **Dashboard**: ringkasan absensi hari ini, sisa cuti, notifikasi approval
- **Absen**: halaman selfie + lokasi real-time + tombol Clock In/Out
- **Riwayat**: daftar absensi, cuti, lembur, izin
- **Pengajuan**: form cuti, izin, koreksi absensi
- **Slip Gaji**: download/view slip gaji per periode

---

*Dokumen ini merupakan bagian dari "New HRIS Samugara" yang difokuskan pada fitur karyawan.*
