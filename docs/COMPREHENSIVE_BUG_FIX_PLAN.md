# HRIS Samugara - Comprehensive Bug Fix & Improvement Plan

> Update: 2 Mei 2026
> Dokumen ini berisi hasil deep scan menyeluruh terhadap backend HRIS Samugara beserta rencana perbaikan.

---

## Executive Summary

Hasil deep scan menemukan **2 bug CRITICAL**, **1 issue HIGH**, dan **~15 bug MEDIUM/LOW** yang tersebar di seluruh codebase. Selain itu ada beberapa issue database CHECK constraint yang harus diselesaikan via SQL langsung di Supabase.

---

## Bug CRITICAL (Harus segera diperbaiki)

### 1. Notification Injection Vulnerability

**File:** `src/modules/notification/notification.controller.ts:53`
**Deskripsi:** Endpoint `POST /notifications` tidak memiliki `@Roles()` decorator. Karena controller menggunakan class-level `RolesGuard`, maka endpoint tanpa `@Roles` akan **open untuk semua user terautentikasi**.

**Dampak:** Karyawan mana pun bisa:

- Kirim notifikasi ke user lain (termasuk admin/HRD)
- Trigger FCM push notification ke device user lain
- Spam notifikasi

**Fix:**

```typescript
@Post()
@Roles('admin', 'super_admin')  // Atau siapa yang boleh create notif
async createNotification(...)
```

**Tambahan:** Di service layer (`notification.service.ts:84`), tambah validasi bahwa caller hanya boleh kirim notifikasi ke bawahannya (atau ke diri sendiri).

---

### 2. Database CHECK Constraint - Status Mismatch

**Tabel:** `tr_leave_requests`, `tr_overnight_requests`, `tr_reimbursements`, `tr_attendance_corrections`, `tr_time_off_requests`
**Deskripsi:** Database PostgreSQL punya CHECK constraint yang membatasi nilai `status`. Nilai `supervisor_approved` (yang digunakan di approval flow 2 lapis) **tidak termasuk** di constraint, menyebabkan 500 error saat supervisor approve.

**Fix:** Jalankan SQL di Supabase SQL Editor:

```sql
-- File: docs/fix-status-constraints.sql
-- Lihat file tersebut untuk script lengkap
```

**Status:** File SQL sudah dibuat, tinggal di-run di Supabase.

---

## Issue HIGH

### 3. Systemic Role Exclusion - `manager_hrga`

**File:** ~15 service files
**Deskripsi:** Banyak service menggunakan array hardcoded `['hrd', 'admin', 'super_admin']` untuk cek admin access. Role `manager_hrga` (level 2 di hierarchy) **sengaja di-exclude** dari semua modul:

- Payroll (generate, publish, export)
- Work Schedules (CRUD)
- Holiday Calendar (CRUD)
- Employee Management (create/update)
- Overtime Meal Allowance (CRUD)
- Leave Types (CRUD)
- Time-off Types (CRUD)
- Recruitment (job posting CRUD)
- Parameter (CRUD)

**Fix:** Standarisasi semua `isAdminOrHRD()` dan `@Roles()` untuk include `'manager_hrga'` di semua modul di mana `hrd` punya akses.

**Keputusan:** `manager_hrga` sama dengan `hrd` dalam hal akses admin (bisa akses semua yang HRD bisa, kecuali yang memang hanya untuk `hrd` saja).

---

## Bug MEDIUM (8 items)

### 4. Attendance Correction - Null Reference

**File:** `src/modules/attendance/attendance.service.ts:751,757`
**Deskripsi:** `correction.tr_attendances.attendance_date` diakses tanpa null-check. Jika `attendance_id` null (schema allow), `tr_attendances` relation = null -> crash.

**Fix:**

```typescript
const attendanceDate = correction.tr_attendances?.attendance_date;
if (!attendanceDate) {
  throw new NotFoundException('Attendance record not found');
}
```

---

### 5. Overtime - Null Reference

**File:** `src/modules/overtime/overtime.service.ts:221`
**Deskripsi:** `targetEmployee.user_id` bisa null (schema allow), terus dilempar ke `findUnique` yang menerima required field -> Prisma error.

**Fix:**

```typescript
if (!targetEmployee.user_id) {
  throw new BadRequestException(
    'Employee does not have an associated user account',
  );
}
```

---

### 6. Time Format Parsing - Invalid Date

**File:**

- `src/modules/work-schedule/work-schedule.service.ts:30-34`
- `src/modules/overtime-meal-allowance/overtime-meal-allowance.service.ts:33-34`
  **Deskripsi:** Parse time string `new Date('1970-01-01T${dto.start_time}')` tanpa validasi format. Kalau string invalid -> `Invalid Date` masuk ke Prisma -> crash.

**Fix:** Tambah `@Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)` di DTO.

---

### 7. Auth - JWT Secret Missing

**File:** `src/modules/auth/auth.service.ts:45`
**Deskripsi:** `jwtSecret` dari `ConfigService`. Kalau env var `JWT_SECRET` hilang -> `undefined` -> `jwt.sign` throw error.

**Fix:**

```typescript
const jwtSecret = this.configService.get<string>('JWT_SECRET');
if (!jwtSecret) {
  throw new InternalServerErrorException('JWT_SECRET not configured');
}
```

---

### 8. Employee - Missing Role

**File:** `src/modules/employee/employee.service.ts:40-50`
**Deskripsi:** `role_id = karyawanRole?.id`. Kalau role `karyawan` tidak ada di DB -> `undefined` -> `tr_users.create` FK constraint error.

**Fix:**

```typescript
if (!karyawanRole) {
  throw new InternalServerErrorException(
    'Default role karyawan not found in database',
  );
}
```

---

### 9. Payroll Period - Status Enum Mismatch

**File:**

- `src/modules/payroll/dto/generate-payslip.dto.ts:173`
- `src/modules/payroll/payroll.service.ts:730,747`
  **Deskripsi:** `UpdatePayrollPeriodDto` allow status `['draft', 'processing', 'closed']`, tapi service logic cek `'published'` dan `'closed'`. `'processing'` mungkin tidak ada di DB CHECK constraint, dan `'published'` valid tapi tidak ada di DTO.

**Fix:** Sinkronkan DTO enum dengan DB constraint dan service logic.

---

### 10. Overtime - Status Constraint Risk

**File:** `src/modules/overtime/overtime.service.ts:645`
**Deskripsi:** Set `status: 'processed'` di `tr_overtime_requests`. SQL fix tidak cover tabel ini. Kalau CHECK constraint hanya allow `pending/approved/rejected/cancelled`, akan crash.

**Fix:** Tambah `'processed'` ke CHECK constraint di Supabase, atau ubah jadi `approved` lalu `processed` via field terpisah.

---

### 11. Attendance Correction - Status Constraint

**File:** `src/modules/attendance/attendance.service.ts:726,774`
**Deskripsi:** Set `status: 'supervisor_approved'` dan `'approved'` di `tr_attendance_corrections`. Belum di-fix di Supabase.

**Fix:** Jalankan SQL untuk `tr_attendance_corrections` juga.

---

### 12. Time-off - Status Constraint

**File:** `src/modules/time-off/time-off.service.ts:152,183,191`
**Deskripsi:** Set `status: 'supervisor_approved'` di `tr_time_off_requests`. Belum di-fix di Supabase.

**Fix:** Jalankan SQL untuk `tr_time_off_requests` juga.

---

## Bug LOW (5+ items)

### 13. Defense-in-Depth - Missing @Roles on Cancel Endpoints

**File:**

- `src/modules/leave/leave.controller.ts:70` (cancel leave)
- `src/modules/time-off/time-off.controller.ts:56` (cancel time-off)
- `src/modules/overtime/overtime.controller.ts:40` (cancel overtime)
- `src/modules/attendance/attendance.controller.ts:88` (cancel correction)
  **Deskripsi:** Endpoint cancel tidak pakai `@Roles()`, tapi service sudah cek ownership. Ini sebenarnya aman, tapi defense-in-depth kurang.

**Fix:** Tambah `@Roles()` yang sesuai (biasanya semua role boleh cancel milik sendiri).

---

### 14. Face Registration - Missing RolesGuard

**File:** `src/modules/face-registration/face-registration.controller.ts`
**Deskripsi:** Controller hanya pakai `JwtAuthGuard`, tidak ada `RolesGuard`. Pattern tidak konsisten dengan controller lain.

**Fix:** Tambah `@UseGuards(JwtAuthGuard, RolesGuard)` di class level.

---

### 15. JWT Auth Guard - DB Dependency

**File:** `src/common/guards/jwt-auth.guard.ts:32-35`
**Deskripsi:** Setiap request authenticated melakukan DB lookup. Kalau DB down -> semua request jadi 401 (seharusnya 500/503).

**Fix:** Opsional - cache user di memory atau Redis.

---

## Rekomendasi Database CHECK Constraint

Tabel berikut harus di-update via SQL di Supabase:

| Tabel                       | Status yang Harus Diizinkan                                                        |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `tr_leave_requests`         | `pending`, `supervisor_approved`, `approved`, `rejected`, `cancelled`              |
| `tr_overnight_requests`     | `pending`, `supervisor_approved`, `approved`, `rejected`, `cancelled`              |
| `tr_reimbursements`         | `pending`, `supervisor_approved`, `approved`, `rejected`, `cancelled`              |
| `tr_attendance_corrections` | `pending`, `supervisor_approved`, `approved`, `rejected`, `cancelled`              |
| `tr_time_off_requests`      | `pending`, `supervisor_approved`, `approved`, `rejected`, `cancelled`              |
| `tr_overtime_requests`      | `pending`, `supervisor_approved`, `approved`, `rejected`, `cancelled`, `processed` |

**Note:** Kalau `tr_overtime_requests` memang tidak boleh punya `supervisor_approved`, hapus status tersebut dari kode (jangan masukkan ke constraint).

---

## Action Items (Urutan Pengerjaan)

### Phase 1: CRITICAL (Hari ini)

- [ ] Fix 1: Tambah `@Roles('admin', 'super_admin')` di `POST /notifications`
- [ ] Fix 2: Run `docs/fix-status-constraints.sql` di Supabase
- [ ] Fix 3: Fix `notification.service.ts` - validasi sender authorization

### Phase 2: HIGH (Minggu ini)

- [ ] Standarisasi semua `isAdminOrHRD` arrays untuk include `'manager_hrga'`
- [ ] Update semua `@Roles()` yang exclude `manager_hrga` tapi include `hrd`

### Phase 3: MEDIUM (Minggu depan)

- [ ] Fix null reference: attendance correction + overtime
- [ ] Fix time format validation di DTO (work schedule, meal allowance)
- [ ] Fix JWT secret null check
- [ ] Fix employee default role check
- [ ] Sync payroll period status enum

### Phase 4: LOW (Sprint berikutnya)

- [ ] Tambah `@Roles` di cancel endpoints
- [ ] Tambah `RolesGuard` di face registration
- [ ] Consider Redis caching untuk user auth

---

## Tentang POST /recruitment/apply

**Endpoint:** `POST /recruitment/apply`
**Status:** Public (tanpa login)
**Rate Limit:** 5 request per menit
**Isi:**

```json
{
  "job_posting_id": "uuid",
  "full_name": "Nama Pelamar",
  "email": "email@example.com",
  "phone": "08123456789",
  "resume_url": "https://...",
  "cover_letter": "Optional"
}
```

**Fungsi:** Untuk pelamar eksternal (bukan karyawan) apply lowongan kerja via public page. Memang **by design public** karena pelamar tidak punya akun di sistem. Rate limit sudah ada untuk mencegah spam. Tidak perlu diubah.

---

## Notes

- Semua perubahan kode sudah di-build dan lolos `npm run build`
- SQL fix belum di-run di Supabase (menunggu konfirmasi)
- `manager_hrga` = `hrd` dalam hal akses (kecuali yang memang hanya untuk `hrd`)
