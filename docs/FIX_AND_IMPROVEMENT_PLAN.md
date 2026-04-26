# HRIS Backend — Fix & Improvement Plan

> Dokumen ini berisi daftar perbaikan yang sudah dilakukan dan yang masih perlu dikerjakan.
> Update terakhir: 26 April 2026

---

## Status: Build Errors (BLOCKER — harus diperbaiki duluan)

Ada **2 build error** yang harus diperbaiki sebelum deploy:

### 1. `payroll.service.ts:379` — Loan Deductions Type Mismatch

- **Error**: Prisma `Decimal` type tidak assignable ke `number` pada parameter `updateLoanBalances`
- **Fix**: Tambahkan `as any[]` pada pemanggilan `updateLoanBalances` yang kedua (line ~496 sudah diperbaiki, line 379 belum)
- **File**: `src/modules/payroll/payroll.service.ts`

### 2. `payroll.service.ts:660` — Wrong DTO class name

- **Error**: `GenerateThrDto` tidak ditemukan, seharusnya `GenerateTHRDto`
- **Fix**: Ganti `GenerateThrDto` → `GenerateTHRDto` di signature method `generateTHR()`
- **File**: `src/modules/payroll/payroll.service.ts`

---

## Sudah Selesai (Completed)

### Attendance Module

- [x] Hitung **uang kehadiran** (`attendance_allowance`) saat clock-out lengkap (Rp 25.000)
- [x] Hitung **potongan early leave** (Rp 5.000/jam, toleransi 5 menit)
- [x] **Holiday check** via `ms_holiday_calendars` — status `holiday` jika hari libur
- [x] **Auto-mark absent** — Cron job jam 23:00 menandai karyawan yang tidak absen sebagai `absent`
- [x] **Correction recalculation** — Saat koreksi di-approve HRGA, `recalculateAttendance()` mengupdate `late_minutes`, `late_deduction`, `early_leave_minutes`, `attendance_allowance`, `is_holiday`, `status`
- [x] **GPS error message** — Sekarang menampilkan radius aktual dari `ms_locations.radius_meters`, bukan hardcoded 100m
- [x] **Photo validation** — `throw new BadRequestException()` bukan `throw new Error()` (sebelumnya return 500, sekarang 400)
- [x] **Cancel correction** endpoint — `PATCH /attendance/corrections/:id/cancel`
- [x] **List all attendance** endpoint — `GET /attendance/all` (HR/Admin only)
- [x] **Duplicate correction prevention** — Tidak bisa submit koreksi jika sudah ada yang pending
- [x] **DTO improvements** — Lat/lng min/max validation, HH:mm regex on correction DTO, pagination validation on ListAttendanceDto

### Overtime Module

- [x] **Rate multiplier sesuai UU Ketenagakerjaan**:
  - Weekday: jam ke-1 = 1.5x, jam ke-2+ = 2x
  - Weekend/holiday: jam 1-8 = 2x, jam 9-10 = 3x, jam 11+ = 4x
- [x] **Server-side `day_type` calculation** — Dihitung dari tanggal + `ms_holiday_calendars`, bukan dari client
- [x] **Cross-midnight support** — Shift malam (misal 22:00-02:00) sudah didukung
- [x] **Duplicate overtime prevention** — Cek existing overtime untuk employee+date yang sama
- [x] **Cancel overtime** endpoint — Pembuat bisa batalkan request yang masih pending
- [x] **Delete overtime** endpoint — Admin bisa hard-delete request pending/rejected/cancelled
- [x] **Remove `day_type` from DTO** — Tidak lagi dikirim client, dihitung server-side

### Payroll Module

- [x] **Cut-off 26-25 diimplementasi** — Menggunakan `attendance_cutoff_start/end` dari `tr_payroll_periods`
- [x] **Prorate diterapkan** — Jika `is_prorated`, `base_salary` dan `fixed_allowance` diganti dengan prorated amount di gross income
- [x] **PPh21 progresif** — Implementasi lengkap: PTKP (TK/0, K/0, K/I/0, dll), progressive brackets (5%/15%/25%/30%), annualize → apply PTKP → rates → divide by 12
- [x] **BPJS real rates**:
  - Kesehatan: 1% employee share, cap salary ceiling Rp 9.159.300
  - Ketenagakerjaan: JHT 2% + JKM 0.3% + JKK 0.24% = 2.54%
- [x] **THR generation** — `POST /payroll/thr/generate`, formula: `(base_salary / 12) * months_worked`
- [x] **Batch generate payslip** — `POST /payroll/generate-batch`, proses semua karyawan aktif
- [x] **Payroll period CRUD** — `POST /payroll/periods` dan `PATCH /payroll/periods/:id`
- [x] **Duplicate payslip prevention** — Cek existing sebelum create
- [x] **`employee_id` required** di `GeneratePayslipDto`
- [x] **Loan deduction scoped** — Cap at `remaining_amount`, update balance setelah deduct
- [x] **`UpdatePayrollPeriodDto`** — Ditambah field `status` (draft/processing/closed)

### Leave Module

- [x] **Balance di-revert saat reject** — `used_days` di-decrement saat HRGA reject
- [x] **Balance di-revert saat cancel** — `cancelLeave()` mengembalikan `used_days`
- [x] **Auto-reset annual leave** — Cron job 1 Januari, upsert balance `total_days=12, used_days=0` untuk semua karyawan aktif dengan `is_annual` leave types
- [x] **Overlap validation** — Cek apakah ada cuti yang tanggalnya overlap sebelum create
- [x] **Cancel endpoint** — `PATCH /leave/:id/cancel`
- [x] **total_days validation** — Validasi `total_days` tidak melebihi jumlah hari antara `start_date` dan `end_date`
- [x] **requires_attachment check** — Jika `ms_leave_types.requires_attachment = true` dan tidak ada `attachment_url`, throw error
- [x] **Proactive getLeaveBalance** — Return semua leave types dengan balance, bukan hanya yang pernah di-request

### Time-off Module

- [x] **Cancel endpoint** — `PATCH /time-off/:id/cancel`
- [x] **HH:mm format validation** — `@Matches` regex pada `start_time` dan `end_time`

### Recruitment Module

- [x] **Auto email rejection** — Saat status `ditolak`, buat notifikasi + set `rejection_email_sent=true`
- [x] **Update job posting** — `PATCH /recruitment/jobs/:id` (HR/Admin)
- [x] **Delete job posting** — `DELETE /recruitment/jobs/:id` (HR/Admin, soft-delete)
- [x] **UpdateJobDto** — DTO baru untuk update job posting

### Employee Module

- [x] **Create employee endpoint** — `POST /employees` (HR/Admin), auto-create `tr_users` jika email+password disertakan
- [x] **Update DTO diperbaiki** — Tambah `department_id`, `position_id`, `location_id`, `supervisor_id`, `manager_id`; salary fields pakai `@IsNumber` bukan `@IsString`
- [x] **Gender validation** — `@IsIn(['male', 'female'])`

### All Approval Modules

- [x] **Supervisor-employee relationship validation** — Attendance correction sudah mengecek `supervisor_id` match (perlu ditambahkan di leave dan time-off)

---

## Belum Selesai (Pending)

### HIGH Priority

#### 1. Supervisor validation di Leave & Time-off approval

- **File**: `src/modules/leave/leave.service.ts`, `src/modules/time-off/time-off.service.ts`
- **Deskripsi**: Saat ini `atasan` bisa approve request bawahan siapa saja. Perlu cek bahwa `employee.supervisor_id === approver.id`
- **Referensi**: requirements.md §9.1

#### 2. Build & Deploy Verification

- Setelah fix 2 build errors di atas, jalankan:
  ```bash
  npx nest build
  git add .
  git commit -m "fix: resolve all requirement gaps for HRIS backend"
  git push
  ```
- Lalu cek Vercel auto-deploy sukses atau tidak
- Test endpoint: `https://hris-backend-six.vercel.app/api/docs`

### MEDIUM Priority

#### 3. FCM Push Notification Integration

- **Deskripsi**: Saat ini notifikasi hanya disimpan ke database. Perlu kirim push notification via Firebase Cloud Messaging
- **File baru**: `src/common/services/fcm.service.ts`
- **Dependencies**: `firebase-admin` package
- **Trigger**: Saat create notification (di semua module approval)
- **Referensi**: requirements.md §10.1

#### 4. Report Export (Excel/PDF)

- **Deskripsi**: Tidak ada endpoint export laporan. Perlu generate file Excel/PDF untuk:
  - Rekap absensi harian/bulanan
  - Rekap lembur per karyawan
  - Slip gaji digital (PDF)
  - Report cuti & sisa saldo cuti
  - Report rekrutmen
- **Dependencies**: `exceljs` untuk Excel, `pdfkit` atau `puppeteer` untuk PDF
- **Referensi**: requirements.md §10.2, §11.2

#### 5. PDF Payslip Generation

- **File**: `src/modules/payroll/payroll.service.ts` → `publishPayslip()`
- **Deskripsi**: Saat ini `pdf_url` adalah fake URL. Perlu generate PDF asli menggunakan template
- **Dependencies**: `pdfkit` atau `puppeteer`

#### 6. Kalender Kerja / Holiday Calendar CRUD

- **Deskripsi**: Tidak ada endpoint untuk mengelola `ms_holiday_calendars`. Perlu CRUD untuk admin menambah/mengedit hari libur nasional dan cuti bersama
- **Referensi**: requirements.md §10.3

### LOW Priority

#### 7. Work Schedule CRUD

- **Deskripsi**: Tidak ada endpoint untuk mengelola `ms_work_schedules` dan `tr_employee_schedules`. Perlu CRUD untuk admin mengatur jadwal kerja (normal, Ramadhan, shift)

#### 8. Leave Type CRUD

- **Deskripsi**: `ms_leave_types` hanya bisa dikelola langsung di database. Perlu endpoint CRUD

#### 9. Time-off Type CRUD

- **Deskripsi**: `ms_time_off_types` hanya bisa dikelola langsung di database. Perlu endpoint CRUD

#### 10. Overtime Meal Allowance CRUD

- **Deskripsi**: `ms_overtime_meal_allowances` hanya bisa dikelola langsung di database. Perlu endpoint CRUD

#### 11. Rate Limiting pada Public Endpoints

- **Deskripsi**: `POST /recruitment/apply` dan `GET /recruitment/jobs` tidak punya rate limiting. Rentan terhadap spam
- **Dependencies**: `@nestjs/throttler`

#### 12. Database Transaction Wrapping

- **Deskripsi**: Banyak operasi multi-step (approval + balance deduction) tidak dibungkus transaction. Jika salah satu step gagal, data tidak konsisten
- **File**: Semua service files, terutama `leave.service.ts`, `payroll.service.ts`

#### 13. Race Condition pada Leave Balance

- **Deskripsi**: Concurrent leave requests bisa melewati balance check bersamaan. Perlu database-level lock atau SERIALIZABLE isolation
- **File**: `src/modules/leave/leave.service.ts`

---

## Quick Start Guide untuk Session Baru

1. Fix 2 build errors (lihat bagian **BLOCKER** di atas)
2. Jalankan `npx nest build` — pastikan 0 errors
3. `git add . && git commit -m "fix: resolve all requirement gaps" && git push`
4. Cek Vercel deploy
5. Lanjutkan item **Pending** sesuai prioritas

---

## Schema Changes yang Mungkin Diperlukan

Jika belum ada di schema, berikut field yang perlu ditambahkan:

| Model                 | Field                     | Type                      | Keterangan                          |
| --------------------- | ------------------------- | ------------------------- | ----------------------------------- |
| `tr_attendances`      | `is_holiday`              | `Boolean @default(false)` | Penanda hari libur                  |
| `ms_work_schedules`   | `work_days`               | `Int[]`                   | Hari kerja (1=Senin, 7=Minggu)      |
| `ms_work_schedules`   | `is_holiday_off`          | `Boolean @default(true)`  | Apakah libur di hari libur nasional |
| `tr_job_applications` | `rejection_email_sent`    | `Boolean @default(false)` | Flag email penolakan sudah dikirim  |
| `tr_job_applications` | `rejection_email_sent_at` | `DateTime?`               | Waktu email penolakan dikirim       |

Jalankan setelah edit schema:

```bash
npx prisma db push
npx prisma generate
```
