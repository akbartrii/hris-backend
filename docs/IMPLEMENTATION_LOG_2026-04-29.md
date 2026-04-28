# Implementation Log - Session 2026-04-29

> Dokumen ini berisi ringkasan semua implementasi yang dilakukan pada session ini.
> Semua perubahan sudah di-build dan verified (NestJS build success).
> **Belum ada commit/push** ke repository.

---

## 1. Tabel Master TER (Tarif Efektif Rata-rata) PPh21

**Files:**

- `ms_ter_seed.sql` (di root)

**Tabel dibuat:**

- `ms_ter` - 10 rows (PTKP names + TER types)
- `ms_ter_fee` - 126 rows (fee brackets per TER type)

**Data source:** `@ms_ter_202604282137.csv` dan `@ms_ter_fee_202604282137.csv`

---

## 2. Modul Company

**Tabel baru di Supabase:**

- `ms_companies` (sudah ada di schema, belum ada module)

**Files baru:**

- `src/modules/company/company.controller.ts`
- `src/modules/company/company.service.ts`
- `src/modules/company/company.module.ts`
- `src/modules/company/dto/create-company.dto.ts`
- `src/modules/company/dto/update-company.dto.ts`
- `src/modules/company/dto/list-company.dto.ts`

**API Endpoints:**

- `GET /companies` - list semua company
- `POST /companies` - create (super_admin only)
- `PATCH /companies/:id` - update (super_admin only)
- `DELETE /companies/:id` - delete (super_admin only)

---

## 3. Remote Work / WFH System

**Tabel baru di Supabase:**

```sql
tr_remote_work_requests (
  id, employee_id, start_date, end_date,
  latitude, longitude, address, radius_meters (default 50),
  status (pending/approved/rejected),
  supervisor_id, approved_at, rejected_reason, reason
)
```

**Alter table:**

- `tr_employees` + `current_remote_work_id` (UUID, nullable, unique, FK ke tr_remote_work_requests)

**Files baru:**

- `src/modules/remote-work/remote-work.controller.ts`
- `src/modules/remote-work/remote-work.service.ts`
- `src/modules/remote-work/remote-work.module.ts`
- `src/modules/remote-work/dto/create-remote-work.dto.ts`
- `src/modules/remote-work/dto/update-remote-work.dto.ts`
- `src/modules/remote-work/dto/list-remote-work.dto.ts`
- `src/modules/remote-work/dto/approve-remote-work.dto.ts`

**Flow:**

1. Employee request WFH (POST /remote-work)
2. Supervisor approve (PATCH /remote-work/:id/approve)
3. Saat approve: `current_remote_work_id` di tr_employees di-update
4. Clock-in: validasi GPS ke koordinat WFH jika `current_remote_work_id` valid & masuk periode
5. Saat expired: auto-clear `current_remote_work_id` saat clock-in

**API Endpoints:**

- `GET /remote-work` - list request (employee lihat sendiri)
- `POST /remote-work` - request WFH
- `PATCH /remote-work/:id/approve` - approve/reject

---

## 4. Update Request Types

### Overtime

- **Tambah field:** `type` (weekday/weekend) - user-selected
- **File updated:** `overtime.service.ts`, `create-overtime.dto.ts`

### Leave

- **Tambah field:** `work_handover_to` (UUID ke employee)
- **File updated:** `leave.service.ts`, `create-leave.dto.ts`

### Time-Off

- **Ubah:** dari 1 hari jadi date range (`start_date` + `end_date`)
- **Tambah:** `work_handover_to`
- **File updated:** `time-off.service.ts`, `create-time-off.dto.ts`

---

## 5. Modul Overnight (Lembur Malam)

**Tabel baru di Supabase:**

```sql
tr_overnight_requests (
  id, employee_id, date, shift_type, remarks,
  status, supervisor_id, supervisor_approved_at, rejection_reason
)
```

**Files baru:**

- `src/modules/overnight/overnight.controller.ts`
- `src/modules/overnight/overnight.service.ts`
- `src/modules/overnight/overnight.module.ts`
- `src/modules/overnight/dto/create-overnight.dto.ts`
- `src/modules/overnight/dto/approve-overnight.dto.ts`
- `src/modules/overnight/dto/list-overnight.dto.ts`

**API Endpoints:**

- `GET /overnight` - list
- `POST /overnight` - request
- `PATCH /overnight/:id/approve` - approve/reject

---

## 6. Modul Reimbursement

**Tabel baru di Supabase:**

```sql
tr_reimbursements (
  id, employee_id, date, category, amount, description,
  proof_image_url, status, supervisor_id, supervisor_approved_at,
  hr_approved_by, hr_approved_at, rejection_reason
)
```

**Approval flow: 2-step**

1. Direct Leader approve → status: `supervisor_approved`
2. HR/Admin approve → status: `approved`

**Files baru:**

- `src/modules/reimbursement/reimbursement.controller.ts`
- `src/modules/reimbursement/reimbursement.service.ts`
- `src/modules/reimbursement/reimbursement.module.ts`
- `src/modules/reimbursement/dto/create-reimbursement.dto.ts`
- `src/modules/reimbursement/dto/approve-reimbursement.dto.ts`
- `src/modules/reimbursement/dto/list-reimbursement.dto.ts`

**API Endpoints:**

- `GET /reimbursements` - list
- `POST /reimbursements` - submit
- `PATCH /reimbursements/:id/approve` - approve/reject (supervisor or HR)

---

## 7. Payroll Enhancement

### Schema Updates

**Tabel `tr_employees` + kolom baru:**

- `ptkp_status` (default 'TK/0')
- `npwp`
- `bank_name`
- `bank_account_number`
- `bank_account_holder`

**Tabel `tr_payslips` + kolom baru:**

- `bpjs_jp`
- `reimbursement_amount`
- `unpaid_leave_deduction`

### PPh21 Calculation

- **Dari:** Metode annualized lama (gross x 12 - PTKP - progressive brackets / 12)
- **Menjadi:** TER (Tarif Efektif Rata-rata) - lookup tabel `ms_ter` + `ms_ter_fee`
- **File:** `payroll.service.ts`

### BPJS Updates

- **Kesehatan cap:** 9.159.300 → **12.000.000**
- **Tambah JP (Jaminan Pensiun):** 1% dari gaji, cap 9.559.600

### Unpaid Leave Deduction

- Leave yang `is_paid = false` otomatis dipotong dari gaji
- Perhitungan: daily rate x hari cuti dalam periode

### Reimbursement Integration

- Approved reimbursements dalam periode otomatis masuk ke gross income

### Export Payroll Excel

**File baru:** `ExportPayrollDto`
**Endpoint:** `POST /payroll/export`

- Export payslip periode ke Excel (.xlsx)
- Kolom: NIK, Nama, Bank, No Rekening, semua income & deduction components, Gross, Total Deductions, Net

---

## 8. Parameter Configuration System

**Tabel baru di Supabase:**

```sql
ms_parameters (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE,
  value VARCHAR(255),
  created_at, updated_at
)
```

**25 parameter di-insert (semua hardcoded values yang sebelumnya di code):**

| Key                                      | Value    | Digunakan di |
| ---------------------------------------- | -------- | ------------ |
| `bpjs_kesehatan_cap`                     | 12000000 | Payroll      |
| `bpjs_jp_cap`                            | 9559600  | Payroll      |
| `bpjs_kesehatan_rate`                    | 0.01     | Payroll      |
| `bpjs_jht_rate`                          | 0.02     | Payroll      |
| `bpjs_jkm_rate`                          | 0.003    | Payroll      |
| `bpjs_jkk_rate`                          | 0.0024   | Payroll      |
| `bpjs_jp_rate`                           | 0.01     | Payroll      |
| `prorate_effective_days`                 | 21       | Payroll      |
| `overtime_divisor`                       | 173      | Overtime     |
| `overtime_weekday_first_hour_multiplier` | 1.5      | Overtime     |
| `overtime_weekday_subsequent_multiplier` | 2        | Overtime     |
| `overtime_weekend_first_8h_multiplier`   | 2        | Overtime     |
| `overtime_weekend_9_10h_multiplier`      | 3        | Overtime     |
| `overtime_weekend_beyond_10h_multiplier` | 4        | Overtime     |
| `overtime_rounding_minutes`              | 30       | Overtime     |
| `late_tolerance_minutes`                 | 5        | Attendance   |
| `late_deduction_rate_per_hour`           | 5000     | Attendance   |
| `early_leave_deduction_rate_per_hour`    | 5000     | Attendance   |
| `attendance_allowance_daily`             | 25000    | Attendance   |
| `gps_default_radius_meters`              | 100      | Attendance   |
| `wfh_default_radius_meters`              | 50       | Remote Work  |
| `thr_divisor_months`                     | 12       | Payroll      |
| `default_ptkp_status`                    | TK/0     | Payroll      |
| `annual_leave_default_days`              | 12       | Leave        |
| `jwt_expiration_days`                    | 7        | Auth         |

**Files baru:**

- `src/modules/parameter/parameter.controller.ts`
- `src/modules/parameter/parameter.service.ts`
- `src/modules/parameter/parameter.module.ts`
- `src/modules/parameter/dto/parameter.dto.ts`

**API Endpoints:**

- `GET /parameters` - list all
- `GET /parameters/:key` - get by key
- `POST /parameters` - create (admin/super_admin)
- `PATCH /parameters/:key` - update (admin/super_admin)
- `DELETE /parameters/:key` - delete (admin/super_admin)

**Services yang sudah direfactor pakai ParameterService:**

- `PayrollService`
- `AttendanceService`
- `OvertimeService`
- `LeaveService`

---

## Files yang Diubah

### Prisma Schema

- `prisma/schema.prisma` - multiple updates (new models, new fields)

### App Module

- `src/app.module.ts` - register CompanyModule, RemoteWorkModule, OvernightModule, ReimbursementModule, ParameterModule

### Payroll

- `src/modules/payroll/payroll.service.ts` - TER calculation, BPJS update, reimbursement, unpaid leave
- `src/modules/payroll/payroll.controller.ts` - add export endpoint
- `src/modules/payroll/dto/generate-payslip.dto.ts` - add ExportPayrollDto

### Attendance

- `src/modules/attendance/attendance.service.ts` - use parameters, WFH support

### Location

- `src/modules/location/location.service.ts` - include WFH locations
- `src/modules/location/location.controller.ts` - pass userId to list

### Overtime

- `src/modules/overtime/overtime.service.ts` - use parameters for rates

### Leave

- `src/modules/leave/leave.service.ts` - work_handover_to, use parameters

### Time-Off

- `src/modules/time-off/time-off.service.ts` - date range, work_handover_to
- `src/modules/time-off/dto/create-time-off.dto.ts` - start_date, end_date

---

## Next Steps (Opsional)

Jika ada yang belum selesai atau perlu dilanjutkan di session berikutnya:

1. **Frontend integration** - Consume API baru di frontend
2. **Testing** - Unit test untuk PayrollService dengan TER
3. **Migration scripts** - Backup data sebelum deploy ke production
4. **Cron jobs** - Scheduling untuk auto-mark absent, reset leave balances
5. **Notification system** - Notifikasi ke supervisor saat ada request baru
6. **PDF template** - Update payslip PDF template sesuai format baru

---

## How to Verify

```bash
# Build project
npm run build

# Check database
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ms_parameters.findMany().then(console.log).finally(() => p.$disconnect())"

# Check tables
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`.then(console.log).finally(() => p.$disconnect())"
```

---

## Notes

- Semua perubahan sudah di-build dan verified (NestJS build success)
- Tidak ada commit/push ke remote repository
- Untuk deploy: jalankan `npx prisma migrate deploy` (jika pakai migrations) atau pastikan SQL alter sudah di-execute di production database
- Parameter system memungkinkan HR mengubah kebijakan tanpa deploy ulang
