# HRIS Samugara API - Contoh Request Body untuk Postman Testing

Dokumen ini berisi contoh request body lengkap untuk seluruh endpoint API HRIS Samugara menggunakan **data nyata dari database seed**.

## Base URL

- Local: `http://localhost:3000/api`
- Production: Sesuaikan dengan deployment URL

## Headers Default (untuk endpoint yang memerlukan autentikasi)

```json
{
  "Authorization": "Bearer {your_jwt_token}",
  "Content-Type": "application/json"
}
```

---

## DATA NYATA DARI DATABASE

### Company

- **ID**: `e135435b-cac1-4e79-af75-5c0f2bfdb8fd`
- **Nama**: PT Samugara
- **Code**: SAMUGARA

### Departments

| Nama           | Code |
| -------------- | ---- |
| Tegal Office   | TOFF |
| Tegal Lapangan | TLAP |
| Security       | SEC  |
| Keuangan       | KEU  |
| HRGA           | HRGA |
| IT             | IT   |

### Locations

| Nama                     | Tipe     | Latitude | Longitude |
| ------------------------ | -------- | -------- | --------- |
| Tegal Office - Main Gate | fixed    | -6.8694  | 109.1402  |
| Tegal Lapangan - Site A  | fixed    | -6.85    | 109.12    |
| WFH / Dinas Luar         | flexible | -        | -         |

### Users & Employees (Test Accounts)

**Password untuk semua akun test: `password123`**

| Role         | Email                       | User ID                                | Employee ID                            | NIK       |
| ------------ | --------------------------- | -------------------------------------- | -------------------------------------- | --------- |
| Karyawan     | `karyawan@samugara.co.id`   | `3b6a63d3-04ee-49cd-bacd-4844d1b03100` | `3b6a63d3-04ee-49cd-bacd-4844d1b03101` | EMP_KAR   |
| Supervisor   | `spv@samugara.co.id`        | `b216edb8-15e0-4c87-ac9b-fbb610ad0a48` | `b216edb8-15e0-4c87-ac9b-fbb610ad0a49` | EMP_SPV   |
| Manager HRGA | `hrga@samugara.co.id`       | `493421e0-265b-4a28-aa76-d11a684dc14c` | `493421e0-265b-4a28-aa76-d11a684dc14d` | EMP_HRGA  |
| HRD          | `hrd@samugara.co.id`        | `b4e31950-9a94-4f9a-baf3-8786602345ce` | `b4e31950-9a94-4f9a-baf3-8786602345cf` | EMP_HRD   |
| Admin        | `admin-role@samugara.co.id` | `c175959f-f09f-4a82-bdcd-0bec1b07491f` | `c175959f-f09f-4a82-bdcd-0bec1b074920` | EMP_ADMIN |
| Super Admin  | `superadmin@samugara.co.id` | `82c61552-9066-4cf5-98d8-cc67950835fc` | `82c61552-9066-4cf5-98d8-cc67950835fd` | EMP_SA    |

### Master Data IDs (dari seed)

- **Department HRGA ID**: `04e95cc5-3ccb-412c-b948-90f89ea0a5d6`
- **Position System Admin ID**: `4bac3ff8-be44-4d39-8bdb-812049daebf1`
- **Location Default ID**: `76cd4d53-6ac5-45bb-a893-8f9e13eade29`
- **Leave Type (Cuti Tahunan) ID**: `2510d5e6-5d06-4044-b504-31b19c939375`

### Sample Data IDs (dari seed test data)

- **Attendance ID (2026-04-28)**: `b6559551-dbca-4d6b-804d-8162b871e8ec`
- **Attendance ID (2026-04-29)**: `402ddfc1-7384-4dbb-9c14-f6b38b4ddb91`
- **Attendance ID (2026-04-30)**: `674dd29a-7df7-48e0-afc4-727028310152`
- **Overtime Request ID**: `7304fb27-cf4f-4dbb-91f9-7d297dd776cd`
- **Leave Request ID**: `8eaba6db-c764-4b85-ab27-4fc680a14b61`
- **Reimbursement ID**: `918d3ea6-6c5f-4278-9969-06686b194a36`
- **Attendance Correction ID**: `e21400f9-ee0d-4afb-88e7-2447d76562c5`
- **Leave Balance ID**: `c5321715-b087-41be-b0d9-2daff81c69e1`

---

## 1. Auth

### POST /api/auth/login

**Karyawan:**

```json
{
  "email": "karyawan@samugara.co.id",
  "password": "password123"
}
```

**Supervisor:**

```json
{
  "email": "spv@samugara.co.id",
  "password": "password123"
}
```

**Manager HRGA:**

```json
{
  "email": "hrga@samugara.co.id",
  "password": "password123"
}
```

**HRD:**

```json
{
  "email": "hrd@samugara.co.id",
  "password": "password123"
}
```

**Admin:**

```json
{
  "email": "admin-role@samugara.co.id",
  "password": "password123"
}
```

**Super Admin:**

```json
{
  "email": "superadmin@samugara.co.id",
  "password": "password123"
}
```

### GET /api/auth/profile

- Header: `Authorization: Bearer {token}`
- Body: None

### POST /api/auth/verify

- Header: `Authorization: Bearer {token}`
- Body: None

---

## 2. Company

### GET /api/companies

- Query Params: `is_active=true&search=samugara`

### POST /api/companies (Super Admin)

```json
{
  "name": "PT Samugara Cabang Bandung",
  "code": "SAM-BDG",
  "address": "Jl. Asia Afrika No. 100, Bandung",
  "phone": "022-12345678",
  "email": "bandung@samugara.co.id",
  "npwp": "09.123.456.7-123.001",
  "is_active": true
}
```

### PATCH /api/companies/e135435b-cac1-4e79-af75-5c0f2bfdb8fd (Super Admin)

```json
{
  "name": "PT Samugara Updated",
  "address": "Jl. Raya Tegal No. 123, Tegal, Jawa Tengah",
  "phone": "(0283) 123456"
}
```

### DELETE /api/companies/{company_id} (Super Admin)

- Body: None

---

## 3. Employee

### POST /api/employees (Admin+)

```json
{
  "full_name": "Ahmad Rizky Pratama",
  "nik": "3175011505890001",
  "email": "ahmad.rizky@samugara.co.id",
  "password": "password123",
  "gender": "male",
  "birth_date": "1989-05-15",
  "department_id": "04e95cc5-3ccb-412c-b948-90f89ea0a5d6",
  "position_id": "4bac3ff8-be44-4d39-8bdb-812049daebf1",
  "location_id": "76cd4d53-6ac5-45bb-a893-8f9e13eade29",
  "supervisor_id": "b216edb8-15e0-4c87-ac9b-fbb610ad0a49",
  "manager_id": "493421e0-265b-4a28-aa76-d11a684dc14d",
  "employment_status": "permanent",
  "join_date": "2023-01-15",
  "contract_end_date": null,
  "base_salary": "8500000",
  "fixed_allowance": "1500000",
  "phone_allowance": "500000",
  "dinas_allowance": "1000000",
  "shift_type": "normal",
  "is_security": false,
  "phone": "081234567890",
  "address": "Jl. Mawar No. 5, Tegal",
  "role_id": null,
  "company_id": "e135435b-cac1-4e79-af75-5c0f2bfdb8fd"
}
```

### GET /api/employees (Admin+)

- Query Params: `department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6&search=ahmad&page=1&limit=10`

### GET /api/employees/3b6a63d3-04ee-49cd-bacd-4844d1b03101 (Admin+)

- Body: None

### PATCH /api/employees/3b6a63d3-04ee-49cd-bacd-4844d1b03101 (Admin+)

```json
{
  "full_name": "Karyawan Test Updated",
  "phone": "081234567899",
  "address": "Jl. Updated No. 10, Tegal",
  "base_salary": 9000000,
  "is_active": true
}
```

### GET /api/employees/3b6a63d3-04ee-49cd-bacd-4844d1b03101/schedules (Employee)

- Body: None

### PATCH /api/employees/3b6a63d3-04ee-49cd-bacd-4844d1b03101/location (Admin+)

```json
{
  "location_id": "76cd4d53-6ac5-45bb-a893-8f9e13eade29"
}
```

---

## 4. Attendance

### POST /api/attendance/clock-in (Employee)

- Content-Type: `multipart/form-data`
- Fields:
  - `photo`: [file upload - foto selfie]
  - `lat`: `-6.8694`
  - `lng`: `109.1402`
  - `notes`: `Sampai di kantor Tegal Office`

### POST /api/attendance/clock-out (Employee)

- Content-Type: `multipart/form-data`
- Fields:
  - `photo`: [file upload - foto selfie]
  - `lat`: `-6.8694`
  - `lng`: `109.1402`
  - `notes`: `Pulang kerja`

### GET /api/attendance/history (Employee)

- Query Params: `date=2026-04-29&month=2026-04&status=on_time&page=1&limit=10`

### GET /api/attendance/all (Admin+)

- Query Params: `date=2026-04-29&month=2026-04&status=on_time&page=1&limit=10`

### GET /api/attendance/subordinates (Supervisor+)

- Query Params: `date=2026-04-29&month=2026-04&status=on_time&page=1&limit=10`

### POST /api/attendance/corrections (Employee)

```json
{
  "attendance_id": "402ddfc1-7384-4dbb-9c14-f6b38b4ddb91",
  "correction_type": "clock_in",
  "correct_clock_in": "08:00",
  "correct_clock_out": null,
  "reason": "Lupa clock-in pagi tadi karena meeting mendadak dengan client"
}
```

Contoh correction_type `both`:

```json
{
  "attendance_id": "402ddfc1-7384-4dbb-9c14-f6b38b4ddb91",
  "correction_type": "both",
  "correct_clock_in": "08:00",
  "correct_clock_out": "17:00",
  "reason": "Terdapat kesalahan input data absensi"
}
```

### PATCH /api/attendance/corrections/e21400f9-ee0d-4afb-88e7-2447d76562c5/cancel (Employee)

- Body: None

### GET /api/attendance/corrections (Employee)

- Query Params: `status=pending&page=1&limit=10`

### PATCH /api/attendance/corrections/e21400f9-ee0d-4afb-88e7-2447d76562c5/approve (Manager+)

```json
{
  "action": "approve",
  "rejection_reason": null
}
```

Contoh reject:

```json
{
  "action": "reject",
  "rejection_reason": "Alasan tidak cukup jelas, mohon lampirkan bukti meeting"
}
```

---

## 5. Face Registration

### GET /api/face-registration/status (Employee)

- Body: None

### POST /api/face-registration (Employee)

- Content-Type: `multipart/form-data`
- Fields:
  - `front_photo`: [file upload - foto wajah depan]
  - `smile_photo`: [file upload - foto wajah senyum]
  - `right_photo`: [file upload - foto wajah kanan]
  - `left_photo`: [file upload - foto wajah kiri]

---

## 6. Holiday Calendar

### GET /api/holiday-calendar (Employee)

- Query Params: `year=2026`

### POST /api/holiday-calendar (HRD+)

```json
{
  "company_id": "e135435b-cac1-4e79-af75-5c0f2bfdb8fd",
  "holiday_date": "2026-05-01",
  "name": "Hari Buruh Internasional",
  "type": "national_holiday",
  "is_recurring": true,
  "year": 2026
}
```

Contoh Cuti Bersama:

```json
{
  "company_id": "e135435b-cac1-4e79-af75-5c0f2bfdb8fd",
  "holiday_date": "2026-05-15",
  "name": "Cuti Bersama Idul Fitri",
  "type": "collective_leave",
  "is_recurring": true,
  "year": 2026
}
```

### PATCH /api/holiday-calendar/{holiday_id} (HRD+)

```json
{
  "name": "Hari Buruh Internasional Updated",
  "type": "national_holiday",
  "is_recurring": true,
  "year": 2026
}
```

### DELETE /api/holiday-calendar/{holiday_id} (HRD+)

- Body: None

---

## 7. Leave (Cuti)

### POST /api/leave (Employee)

```json
{
  "leave_type_id": "2510d5e6-5d06-4044-b504-31b19c939375",
  "start_date": "2026-05-15",
  "end_date": "2026-05-17",
  "total_days": 3,
  "reason": "Cuti tahunan untuk liburan keluarga ke Bali",
  "work_handover_to": "b216edb8-15e0-4c87-ac9b-fbb610ad0a49",
  "attachment_url": "https://storage.samugara.co.id/leave-attachment-123.pdf"
}
```

### GET /api/leave/balance (Employee)

- Body: None

### GET /api/leave (Employee)

- Query Params: `status=pending&page=1&limit=10`

### GET /api/leave/subordinates (Supervisor+)

- Query Params: `status=pending&page=1&limit=10`

### PATCH /api/leave/8eaba6db-c764-4b85-ab27-4fc680a14b61/approve (Manager+)

```json
{
  "action": "approve",
  "rejection_reason": null
}
```

Contoh reject:

```json
{
  "action": "reject",
  "rejection_reason": "Mohon ajukan cuti minimal 2 minggu sebelumnya"
}
```

### PATCH /api/leave/8eaba6db-c764-4b85-ab27-4fc680a14b61/cancel (Employee)

- Body: None

---

## 8. Leave Type

### GET /api/leave-types (Employee)

- Body: None

### POST /api/leave-types (HRD+)

```json
{
  "name": "Cuti Tahunan",
  "code": "annual_leave",
  "default_days": 12,
  "is_annual": true,
  "is_paid": true,
  "requires_attachment": false,
  "max_days_per_request": 12
}
```

Contoh Cuti Sakit:

```json
{
  "name": "Cuti Sakit",
  "code": "sick_leave",
  "default_days": 0,
  "is_annual": false,
  "is_paid": true,
  "requires_attachment": true,
  "max_days_per_request": null
}
```

### PATCH /api/leave-types/2510d5e6-5d06-4044-b504-31b19c939375 (HRD+)

```json
{
  "name": "Cuti Tahunan Updated",
  "code": "annual_leave",
  "default_days": 15,
  "is_annual": true,
  "is_paid": true,
  "requires_attachment": false,
  "max_days_per_request": 15
}
```

### DELETE /api/leave-types/{leave_type_id} (HRD+)

- Body: None

---

## 9. Location

### GET /api/locations (Employee)

- Query Params: `company_id=e135435b-cac1-4e79-af75-5c0f2bfdb8fd&is_active=true`

### POST /api/locations (Admin+)

```json
{
  "company_id": "e135435b-cac1-4e79-af75-5c0f2bfdb8fd",
  "name": "Kantor Pusat Jakarta",
  "type": "fixed",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "radius_meters": 200,
  "address": "Jl. Sudirman No. 1, Jakarta Selatan",
  "is_active": true
}
```

Contoh Site Project:

```json
{
  "company_id": "e135435b-cac1-4e79-af75-5c0f2bfdb8fd",
  "name": "Site Project Semarang",
  "type": "fixed",
  "latitude": -7.0051,
  "longitude": 110.4381,
  "radius_meters": 500,
  "address": "Jl. Pemuda No. 100, Semarang",
  "is_active": true
}
```

### PATCH /api/locations/76cd4d53-6ac5-45bb-a893-8f9e13eade29 (Admin+)

```json
{
  "name": "Tegal Office - Main Gate Updated",
  "type": "fixed",
  "latitude": -6.8694,
  "longitude": 109.1402,
  "radius_meters": 150,
  "address": "Jl. Raya Tegal No. 123",
  "is_active": true
}
```

### DELETE /api/locations/{location_id} (Admin+)

- Body: None

---

## 10. Notification

### GET /api/notifications (Employee)

- Query Params: `is_read=false&page=1&limit=10`

### GET /api/notifications/unread-count (Employee)

- Body: None

### PATCH /api/notifications/{notification_id}/read (Employee)

- Body: None

### PATCH /api/notifications/read-all (Employee)

- Body: None

### POST /api/notifications (Admin+)

```json
{
  "user_id": "3b6a63d3-04ee-49cd-bacd-4844d1b03100",
  "type": "announcement",
  "title": "Pengumuman Libur Nasional",
  "message": "Diumumkan bahwa tanggal 1 Mei 2026 adalah hari libur nasional. Seluruh karyawan tidak perlu masuk kerja.",
  "reference_type": "holiday",
  "reference_id": null
}
```

Contoh notifikasi leave approval:

```json
{
  "user_id": "3b6a63d3-04ee-49cd-bacd-4844d1b03100",
  "type": "leave_approved",
  "title": "Pengajuan Cuti Disetujui",
  "message": "Pengajuan cuti Anda tanggal 15-17 Mei 2026 telah disetujui oleh Manager.",
  "reference_type": "leave_request",
  "reference_id": "8eaba6db-c764-4b85-ab27-4fc680a14b61"
}
```

---

## 11. Overnight (Menginap/Lembur Menginap)

### GET /api/overnight (Employee)

- Query Params: `status=pending&page=1&limit=10`

### GET /api/overnight/subordinates (Supervisor+)

- Query Params: `status=pending&page=1&limit=10`

### POST /api/overnight (Employee)

```json
{
  "date": "2026-05-10",
  "shift_type": "shift_2",
  "remarks": "Menginap di site project karena shift malam dan jarak rumah jauh"
}
```

### PATCH /api/overnight/{overnight_id}/approve (Manager+)

```json
{
  "action": "approve",
  "rejection_reason": null
}
```

Contoh reject:

```json
{
  "action": "reject",
  "rejection_reason": "Mohon ajukan minimal H-3 sebelum tanggal menginap"
}
```

---

## 12. Overtime

### POST /api/overtime (Employee)

```json
{
  "employee_id": "3b6a63d3-04ee-49cd-bacd-4844d1b03101",
  "date": "2026-05-05",
  "start_time": "17:30",
  "end_time": "20:00",
  "type": "weekday",
  "description": "Lembur untuk menyelesaikan laporan bulanan"
}
```

Contoh lembur hari libur:

```json
{
  "employee_id": "3b6a63d3-04ee-49cd-bacd-4844d1b03101",
  "date": "2026-05-03",
  "start_time": "08:00",
  "end_time": "16:00",
  "type": "holiday",
  "description": "Lembur hari Minggu untuk maintenance server"
}
```

### PATCH /api/overtime/7304fb27-cf4f-4dbb-91f9-7d297dd776cd/cancel (Employee)

- Body: None

### GET /api/overtime (Employee)

- Query Params: `status=pending&month=2026-04&employee_id=3b6a63d3-04ee-49cd-bacd-4844d1b03101&page=1&limit=10`

### GET /api/overtime/subordinates (Supervisor+)

- Query Params: `status=pending&month=2026-04&page=1&limit=10`

### GET /api/overtime/summary (Manager+)

- Query Params: `month=2026-04`

### PATCH /api/overtime/7304fb27-cf4f-4dbb-91f9-7d297dd776cd/approve (Manager+)

```json
{
  "action": "approve",
  "rejection_reason": null
}
```

Contoh reject:

```json
{
  "action": "reject",
  "rejection_reason": "Lembur tidak diperlukan, pekerjaan dapat diselesaikan besok"
}
```

### PATCH /api/overtime/7304fb27-cf4f-4dbb-91f9-7d297dd776cd/process (HRD+)

```json
{
  "action": "approve",
  "rejection_reason": null
}
```

### DELETE /api/overtime/{overtime_id} (Employee)

- Body: None (hanya untuk yang belum di-approve)

---

## 13. Overtime Meal Allowance

### GET /api/overtime-meal-allowances (HRD+)

- Body: None

### POST /api/overtime-meal-allowances (HRD+)

```json
{
  "day_type": "workday",
  "time_start": "19:00",
  "time_end": "21:00",
  "amount": "20000"
}
```

Contoh hari libur:

```json
{
  "day_type": "sunday_holiday",
  "time_start": "12:00",
  "time_end": "13:00",
  "amount": "15000"
}
```

### PATCH /api/overtime-meal-allowances/{id} (HRD+)

```json
{
  "day_type": "workday",
  "time_start": "19:00",
  "time_end": "21:00",
  "amount": "25000"
}
```

### DELETE /api/overtime-meal-allowances/{id} (HRD+)

- Body: None

---

## 14. Parameter

### GET /api/parameters (Admin+)

- Body: None

### GET /api/parameters/{key} (Admin+)

- Body: None

### POST /api/parameters (Admin+)

```json
{
  "key": "MAX_LEAVE_DAYS_PER_YEAR",
  "value": "12"
}
```

Contoh lainnya:

```json
{
  "key": "OVERTIME_MULTIPLIER_HOLIDAY",
  "value": "2.0"
}
```

```json
{
  "key": "COMPANY_WORKING_HOURS",
  "value": "08:00-17:00"
}
```

### PATCH /api/parameters/MAX_LEAVE_DAYS_PER_YEAR (Admin+)

```json
{
  "value": "15"
}
```

### DELETE /api/parameters/{key} (Admin+)

- Body: None

---

## 15. Payroll

### GET /api/payroll/payslips (Employee)

- Query Params: `payroll_period_id={uuid}&page=1&limit=10`

### GET /api/payroll/payslips/{payslip_id} (Employee)

- Body: None

### POST /api/payroll/generate (HRD+)

```json
{
  "payroll_period_id": "{payroll_period_uuid}",
  "employee_id": "3b6a63d3-04ee-49cd-bacd-4844d1b03101"
}
```

### POST /api/payroll/generate-batch (HRD+)

```json
{
  "payroll_period_id": "{payroll_period_uuid}"
}
```

### POST /api/payroll/publish (HRD+)

```json
{
  "payslip_id": "{payslip_uuid}"
}
```

### GET /api/payroll/periods (HRD+)

- Query Params: `companyId=e135435b-cac1-4e79-af75-5c0f2bfdb8fd`

### POST /api/payroll/periods (HRD+)

```json
{
  "company_id": "e135435b-cac1-4e79-af75-5c0f2bfdb8fd",
  "month": 5,
  "year": 2026,
  "period_name": "Mei 2026",
  "start_date": "2026-05-01",
  "end_date": "2026-05-31",
  "attendance_cutoff_start": "2026-04-26",
  "attendance_cutoff_end": "2026-05-25",
  "payment_date": "2026-06-01"
}
```

### PATCH /api/payroll/periods/{period_id} (HRD+)

```json
{
  "period_name": "Mei 2026 Updated",
  "status": "processing",
  "payment_date": "2026-06-05"
}
```

### GET /api/payroll/thr (Employee)

- Body: None

### POST /api/payroll/thr/generate (HRD+)

```json
{
  "employee_id": "3b6a63d3-04ee-49cd-bacd-4844d1b03101",
  "period_name": "THR Idul Fitri 2026",
  "year": 2026
}
```

### POST /api/payroll/export (HRD+)

```json
{
  "payroll_period_id": "{payroll_period_uuid}"
}
```

---

## 16. Recruitment

### GET /api/recruitment/jobs (Public)

- Query Params: `status=active&page=1&limit=10`

### GET /api/recruitment/jobs/{slug} (Public)

- Body: None

### POST /api/recruitment/jobs (HRD+)

```json
{
  "title": "Senior Backend Developer",
  "department_id": "04e95cc5-3ccb-412c-b948-90f89ea0a5d6",
  "position_id": "4bac3ff8-be44-4d39-8bdb-812049daebf1",
  "location_id": "76cd4d53-6ac5-45bb-a893-8f9e13eade29",
  "description": "Kami mencari Senior Backend Developer yang berpengalaman dengan NestJS dan PostgreSQL untuk bergabung dengan tim engineering.",
  "requirements": "- Minimal 3 tahun pengalaman dengan Node.js\n- Menguasai NestJS dan TypeScript\n- Pengalaman dengan PostgreSQL dan Prisma\n- Familiar dengan Docker dan CI/CD",
  "employment_type": "full_time",
  "public_slug": "senior-backend-developer",
  "opened_at": "2026-05-01",
  "closed_at": "2026-06-30"
}
```

### PATCH /api/recruitment/jobs/{job_id} (HRD+)

```json
{
  "title": "Senior Backend Developer Updated",
  "description": "Updated job description",
  "requirements": "Updated requirements",
  "employment_type": "full_time",
  "status": "active",
  "closed_at": "2026-07-31"
}
```

### DELETE /api/recruitment/jobs/{job_id} (HRD+)

- Body: None

### POST /api/recruitment/apply (Public)

```json
{
  "job_posting_id": "{job_posting_uuid}",
  "full_name": "Diana Wulandari",
  "email": "diana.wulandari@email.com",
  "phone": "081298765432",
  "resume_url": "https://storage.samugara.co.id/resumes/diana_cv.pdf",
  "cover_letter": "Saya tertarik untuk melamar posisi Senior Backend Developer karena saya memiliki pengalaman 4 tahun dengan NestJS dan PostgreSQL."
}
```

### GET /api/recruitment/applications (HRD+)

- Query Params: `status=new&page=1&limit=10`

### PATCH /api/recruitment/applications/{application_id}/status (HRD+)

```json
{
  "status": "interview",
  "notes": "Kandidat memenuhi kualifikasi, lanjut ke tahap interview teknis"
}
```

Contoh lolos:

```json
{
  "status": "lolos",
  "notes": "Kandidat diterima, akan dikirimkan offering letter"
}
```

Contoh ditolak:

```json
{
  "status": "ditolak",
  "notes": "Sayangnya kualifikasi tidak sesuai dengan kebutuhan saat ini"
}
```

---

## 17. Reimbursement

### GET /api/reimbursements (Employee)

- Query Params: `status=pending&category=transport&page=1&limit=10`

### GET /api/reimbursements/subordinates (Supervisor+)

- Query Params: `status=pending&category=transport&page=1&limit=10`

### POST /api/reimbursements (Employee)

```json
{
  "date": "2026-05-02",
  "category": "transport",
  "amount": 150000,
  "description": "Reimbursement perjalanan dinas ke Semarang untuk meeting client",
  "proof_image_url": "https://storage.samugara.co.id/proof-transport-123.jpg"
}
```

Contoh reimbursement lain:

```json
{
  "date": "2026-05-01",
  "category": "medical",
  "amount": 350000,
  "description": "Pengobatan flu dan pemeriksaan dokter umum",
  "proof_image_url": "https://storage.samugara.co.id/medical-receipt-456.jpg"
}
```

### PATCH /api/reimbursements/918d3ea6-6c5f-4278-9969-06686b194a36/approve (Manager+)

```json
{
  "action": "approve",
  "rejection_reason": null
}
```

Contoh reject:

```json
{
  "action": "reject",
  "rejection_reason": "Bukti transaksi tidak lengkap, mohon lampirkan kwitansi asli"
}
```

---

## 18. Remote Work (Kerja Remote)

### GET /api/remote-work (Employee)

- Query Params: `status=pending&employee_id=3b6a63d3-04ee-49cd-bacd-4844d1b03101&page=1&limit=10`

### POST /api/remote-work (Employee)

```json
{
  "start_date": "2026-05-10",
  "end_date": "2026-05-12",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "address": "Jl. Mawar No. 5, Jakarta Selatan",
  "reason": "Kerja remote karena ada maintenance di rumah dan harus mengawasi tukang"
}
```

### PATCH /api/remote-work/{remote_work_id}/approve (Manager+)

```json
{
  "action": "approve",
  "rejection_reason": null
}
```

Contoh reject:

```json
{
  "action": "reject",
  "rejection_reason": "Mohon ajukan minimal 3 hari kerja sebelumnya"
}
```

---

## 19. Report

### GET /api/reports/attendance (Manager+)

- Query Params: `month=2026-04&department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6&employee_id=3b6a63d3-04ee-49cd-bacd-4844d1b03101`

### GET /api/reports/leave (Manager+)

- Query Params: `year=2026&department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6&status=approved`

### GET /api/reports/payroll (HRD+)

- Query Params: `payroll_period_id={uuid}&department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6`

### GET /api/reports/overtime (Manager+)

- Query Params: `month=2026-04&department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6&employee_id=3b6a63d3-04ee-49cd-bacd-4844d1b03101`

### GET /api/reports/attendance/export (Manager+)

- Query Params: `month=2026-04&department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6`
- Response: File Excel/PDF

### GET /api/reports/leave/export (Manager+)

- Query Params: `year=2026&department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6&status=approved`
- Response: File Excel/PDF

### GET /api/reports/payroll/export (HRD+)

- Query Params: `payroll_period_id={uuid}&department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6`
- Response: File Excel/PDF

### GET /api/reports/overtime/export (Manager+)

- Query Params: `month=2026-04&department_id=04e95cc5-3ccb-412c-b948-90f89ea0a5d6&employee_id=3b6a63d3-04ee-49cd-bacd-4844d1b03101`
- Response: File Excel/PDF

---

## 20. Time Off (Izin)

### POST /api/time-off (Employee)

```json
{
  "time_off_type_id": "{time_off_type_uuid}",
  "start_date": "2026-05-20",
  "end_date": "2026-05-20",
  "start_time": "08:00",
  "end_time": "12:00",
  "reason": "Izin sakit karena demam dan flu",
  "work_handover_to": "b216edb8-15e0-4c87-ac9b-fbb610ad0a49",
  "attachment_url": "https://storage.samugara.co.id/surat-sakit-123.pdf"
}
```

Contoh izin dinas:

```json
{
  "time_off_type_id": "{time_off_type_uuid}",
  "start_date": "2026-05-25",
  "end_date": "2026-05-27",
  "start_time": null,
  "end_time": null,
  "reason": "Izin dinas ke luar kota untuk meeting dengan vendor",
  "work_handover_to": "b216edb8-15e0-4c87-ac9b-fbb610ad0a49",
  "attachment_url": "https://storage.samugara.co.id/surat-dinas-456.pdf"
}
```

### GET /api/time-off (Employee)

- Query Params: `status=pending&page=1&limit=10`

### PATCH /api/time-off/{time_off_id}/approve (Manager+)

```json
{
  "action": "approve",
  "rejection_reason": null
}
```

Contoh reject:

```json
{
  "action": "reject",
  "rejection_reason": "Mohon lampirkan surat keterangan dokter untuk izin sakit"
}
```

### PATCH /api/time-off/{time_off_id}/cancel (Employee)

- Body: None

---

## 21. Time Off Type

### GET /api/time-off-types (Employee)

- Body: None

### POST /api/time-off-types (HRD+)

```json
{
  "name": "Izin Datang Terlambat",
  "code": "late_arrival",
  "affects_salary": false,
  "requires_attachment": false
}
```

Contoh lain:

```json
{
  "name": "Izin Tidak Masuk (Sakit)",
  "code": "absence_sick",
  "affects_salary": false,
  "requires_attachment": true
}
```

```json
{
  "name": "Izin Tidak Masuk (Urusan Penting)",
  "code": "absence_important",
  "affects_salary": true,
  "requires_attachment": false
}
```

### PATCH /api/time-off-types/{time_off_type_id} (HRD+)

```json
{
  "name": "Izin Datang Terlambat Updated",
  "code": "late_arrival",
  "affects_salary": false,
  "requires_attachment": false
}
```

### DELETE /api/time-off-types/{time_off_type_id} (HRD+)

- Body: None

---

## 22. Work Schedule

### GET /api/work-schedules (Employee)

- Body: None

### POST /api/work-schedules (HRD+)

```json
{
  "name": "Shift Pagi",
  "shift_code": "P",
  "schedule_type": "normal",
  "start_time": "07:00",
  "end_time": "15:00",
  "break_start": "12:00",
  "break_end": "13:00",
  "work_days": [1, 2, 3, 4, 5],
  "is_holiday_off": true,
  "notes": "Shift pagi untuk karyawan operasional"
}
```

Contoh shift malam:

```json
{
  "name": "Shift Malam",
  "shift_code": "M",
  "schedule_type": "normal",
  "start_time": "23:00",
  "end_time": "07:00",
  "break_start": "03:00",
  "break_end": "04:00",
  "work_days": [1, 2, 3, 4, 5, 6, 0],
  "is_holiday_off": false,
  "notes": "Shift malam untuk security dan maintenance"
}
```

Contoh normal office hours:

```json
{
  "name": "Tegal Office",
  "shift_code": null,
  "schedule_type": "normal",
  "start_time": "08:00",
  "end_time": "17:00",
  "break_start": "12:00",
  "break_end": "13:00",
  "work_days": [1, 2, 3, 4, 5],
  "is_holiday_off": true,
  "notes": "Senin-Jumat, libur nasional = libur"
}
```

### PATCH /api/work-schedules/{schedule_id} (HRD+)

```json
{
  "name": "Shift Pagi Updated",
  "shift_code": "P",
  "schedule_type": "normal",
  "start_time": "07:00",
  "end_time": "15:00",
  "break_start": "12:00",
  "break_end": "13:00",
  "work_days": [1, 2, 3, 4, 5, 6],
  "is_holiday_off": true,
  "notes": "Shift pagi updated untuk 6 hari kerja"
}
```

### DELETE /api/work-schedules/{schedule_id} (HRD+)

- Body: None

---

## Catatan Penting untuk Testing

### 1. UUIDs yang Digunakan

Semua UUID di atas adalah **data nyata dari database seed**. Jika Anda menjalankan seed SQL, data tersebut akan tersedia di database dengan UUID yang sama persis.

### 2. Role & Authorization

- **Public**: Tidak memerlukan token
- **Employee**: Semua user yang sudah login
- **Supervisor+**: Minimal role `atasan` (spv@samugara.co.id)
- **Manager HRGA+**: Minimal role `manager_hrga` (hrga@samugara.co.id)
- **HRD+**: Minimal role `hrd` (hrd@samugara.co.id)
- **Admin+**: Minimal role `admin` (admin-role@samugara.co.id)
- **Super Admin**: Hanya role `super_admin` (superadmin@samugara.co.id)

### 3. Password Default

**Semua akun test menggunakan password: `password123`**

### 4. File Upload

Untuk endpoint dengan file upload (Attendance clock-in/out, Face Registration):

- Gunakan Content-Type: `multipart/form-data`
- Pastikan file yang diupload adalah gambar (JPG/PNG)
- Untuk Face Registration, gunakan foto wajah yang jelas

### 5. Date & Time Format

- **Date**: `YYYY-MM-DD` (contoh: `2026-05-15`)
- **Time**: `HH:mm` atau `HH:mm:ss` (contoh: `08:00` atau `08:00:00`)
- **Month Query**: `YYYY-MM` (contoh: `2026-05`)

### 6. Enum Values

- **Gender**: `male`, `female`
- **Employment Status**: `permanent`, `contract`, `probation`, `internship`
- **Employment Type**: `full_time`, `part_time`, `contract`, `internship`
- **Shift Type**: `normal`, `shift_1`, `shift_2`, `shift_3`
- **Correction Type**: `clock_in`, `clock_out`, `both`, `forgot_clock_out`, `wrong_attendance`
- **Leave/TimeOff Action**: `approve`, `reject`
- **Application Status**: `new`, `review`, `interview`, `lolos`, `ditolak`
- **Job Status**: `draft`, `active`, `closed`
- **Payroll Period Status**: `draft`, `processing`, `published`, `closed`
- **Day Type**: `workday`, `saturday`, `sunday_holiday`
- **Schedule Type**: `normal`, `ramadhan`
- **Location Type**: `fixed`, `flexible`
- **Holiday Type**: `national_holiday`, `collective_leave`, `company_holiday`

### 7. Testing Sequence yang Disarankan

1. **Login** sebagai Super Admin untuk mendapatkan token
2. **Create Company** (jika perlu)
3. **Create Locations**
4. **Create Work Schedules**
5. **Create Leave Types & Time Off Types**
6. **Create Employees** (atau gunakan akun test yang sudah ada)
7. **Test Attendance** (clock-in/out)
8. **Test Leave/TimeOff/Overtime** submissions
9. **Test Approval** workflows (gunakan akun supervisor/manager)
10. **Test Payroll** generation

### 8. Data Test yang Sudah Tersedia

Setelah menjalankan seed, data berikut sudah tersedia:

- **Company**: PT Samugara
- **Departments**: 6 departemen
- **Locations**: 5 lokasi (termasuk Tegal Office, Tegal Lapangan, WFH)
- **Work Schedules**: 10 jadwal (normal + ramadhan)
- **Leave Types**: 4 jenis cuti
- **Time Off Types**: 4 jenis izin
- **Employees**: 8 karyawan dengan user account
- **Attendance Records**: 30 hari data absensi (April 2026)
- **Leave Requests**: 5 pengajuan cuti
- **Time Off Requests**: 4 pengajuan izin
- **Overtime Requests**: 4 pengajuan lembur
- **Payroll Periods**: 2 periode (Maret & April 2026)
- **Payslips**: 8 slip gaji (Maret 2026)
- **THR Records**: 7 data THR
- **Job Postings**: 3 lowongan kerja
- **Job Applications**: 6 lamaran kerja

### 9. Common Error Cases untuk Testing

- Kirim email tanpa format valid
- Kirim UUID yang tidak valid
- Kirim date di luar range yang diizinkan
- Kirim angka negatif untuk amount/days
- Kirim string yang melebihi MaxLength
- Upload file dengan format yang salah
- Coba akses endpoint tanpa token atau dengan role yang tidak sesuai

---

## Sample cURL Commands

### Login sebagai Karyawan

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "karyawan@samugara.co.id",
    "password": "password123"
  }'
```

### Clock In (dengan foto)

```bash
curl -X POST http://localhost:3000/api/attendance/clock-in \
  -H "Authorization: Bearer {token}" \
  -F "photo=@/path/to/selfie.jpg" \
  -F "lat=-6.8694" \
  -F "lng=109.1402" \
  -F "notes=Sampai di kantor Tegal Office"
```

### Create Employee

```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ahmad Rizky",
    "email": "ahmad.rizky@samugara.co.id",
    "password": "password123",
    "gender": "male",
    "employment_status": "permanent",
    "shift_type": "normal",
    "company_id": "e135435b-cac1-4e79-af75-5c0f2bfdb8fd"
  }'
```

### Generate Payroll Batch

```bash
curl -X POST http://localhost:3000/api/payroll/generate-batch \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "payroll_period_id": "{payroll_period_uuid}"
  }'
```

### Approve Leave Request

```bash
curl -X PATCH http://localhost:3000/api/leave/8eaba6db-c764-4b85-ab27-4fc680a14b61/approve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve"
  }'
```

---

## Notes

- Semua contoh menggunakan **data nyata dari database seed** (file: `database/04_seed_master.sql`, `database/05_seed_dummy.sql`, dan `docs/seed-users-all-roles.sql`)
- UUIDs yang tercantum adalah UUIDs **hardcoded** di seed SQL
- Password untuk semua akun test: **`password123`**
- Base URL local: `http://localhost:3000/api`
- Untuk data yang menggunakan `{uuid}`, Anda perlu mengganti dengan UUID yang sesuai dari database
