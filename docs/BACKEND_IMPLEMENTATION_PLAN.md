# HRIS Samugara — Backend Implementation Plan

> **Mode:** Build  
> **Stack:** NestJS + TypeScript + Prisma + Supabase (PostgreSQL/Auth/Storage)  
> **Deployment:** Render (Free Tier)  
> **API Client:** Ktor (KMP Mobile) + React (Web)  
> **Timeline:** 7 Days MVP

---

## 1. Tech Stack Final

| Layer | Technology | Notes |
|-------|------------|-------|
| **Framework** | NestJS 10 (TypeScript) | Progressive Node.js framework |
| **Package Manager** | npm | Native with Node.js |
| **ORM** | Prisma | `db pull` from existing Supabase schema |
| **Database** | Supabase PostgreSQL | Already provisioned and seeded |
| **Auth** | Supabase Auth | JWT verification via `@supabase/supabase-js` |
| **File Storage** | Supabase Storage | Backend handles multipart upload → Storage |
| **Validation** | `class-validator` + `class-transformer` | DTO validation |
| **API Docs** | Swagger (OpenAPI) | Auto-generated at `/api/docs` |
| **Testing** | Jest | Built-in with NestJS |
| **Deployment** | Render (Web Service - Free Tier) | Auto-deploy from Git |
| **Email** | **SKIPPED** | Will be implemented later |
| **Push Notification** | **SKIPPED** | Will be implemented later |
| **Payroll Calculation** | **MOCK** | Placeholder formulas, to be replaced manually |

---

## 2. Project Structure (Clean Architecture)

```
hris-backend/
├── prisma/
│   ├── schema.prisma              # Auto-generated from Supabase DB
│   └── migrations/                # Prisma migrations (if needed)
├── src/
│   ├── main.ts                    # Entry point, Swagger setup
│   ├── app.module.ts              # Root module
│   ├── common/                    # Shared utilities
│   │   ├── decorators/            # @CurrentUser(), @Roles()
│   │   ├── filters/               # Global exception filter
│   │   ├── guards/                # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/          # TransformInterceptor (standard response)
│   │   └── pipes/                 # ValidationPipe
│   ├── modules/
│   │   ├── auth/                  # Supabase JWT verification, role guards
│   │   ├── attendance/            # Clock in/out, GPS, photo upload, corrections
│   │   ├── leave/                 # Leave requests, balance, approval flow
│   │   ├── time-off/              # Time off requests (sick, late, early leave)
│   │   ├── overtime/              # Overtime requests, calculation, approval
│   │   ├── payroll/               # Payslip generation (MOCK calculation)
│   │   ├── recruitment/           # Job postings, applications, tracking
│   │   ├── employee/              # Employee CRUD, schedules, locations
│   │   ├── notification/          # In-app notifications, Supabase Realtime
│   │   └── report/                # Export Excel/PDF endpoints
│   └── types/                     # Shared TypeScript interfaces
├── test/                          # E2E tests
├── .env                           # Environment variables (not committed)
├── .env.example                   # Template for env vars
├── nest-cli.json                  # NestJS CLI config
├── package.json
├── tsconfig.json
└── render.yaml                    # Render deployment config
```

---

## 3. Implementation Plan (7 Days)

### Day 1: Setup & Auth

**Goals:** Project scaffold, Prisma connection, Supabase Auth, Swagger.

| # | Task | Output |
|---|------|--------|
| 1 | Initialize NestJS project (`nest new`) | `package.json`, `tsconfig.json` |
| 2 | Install dependencies (`@nestjs/*`, `prisma`, `@supabase/supabase-js`, etc.) | `node_modules/` ready |
| 3 | Run `npx prisma db pull` to generate schema from Supabase | `prisma/schema.prisma` |
| 4 | Setup Prisma module and service | `PrismaModule`, `PrismaService` |
| 5 | Setup global validation pipe and exception filter | Auto-validation on all DTOs |
| 6 | Create `TransformInterceptor` for standard API response | `{ success, data, message, meta }` |
| 7 | Implement `AuthModule` with Supabase JWT verification | `POST /auth/verify`, guards |
| 8 | Implement `JwtAuthGuard` and `RolesGuard` | Route protection by role |
| 9 | Setup Swagger UI at `/api/docs` | Auto API documentation |
| 10 | Create `.env.example` with all required keys | Template for environment vars |

**Key Files:**
- `src/main.ts`
- `src/common/interceptors/transform.interceptor.ts`
- `src/common/guards/jwt-auth.guard.ts`
- `src/common/guards/roles.guard.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.controller.ts`
- `prisma/schema.prisma`

---

### Day 2: Attendance Module

**Goals:** Clock in/out, GPS radius validation, photo upload, attendance corrections.

| # | Task | Output |
|---|------|--------|
| 1 | Create `AttendanceModule`, `AttendanceService`, `AttendanceController` | Module scaffold |
| 2 | Implement `POST /attendance/clock-in` | Clock in with GPS + photo |
| 3 | Implement `POST /attendance/clock-out` | Clock out with GPS + photo |
| 4 | Implement GPS distance calculation (Haversine formula) | 100m radius validation |
| 5 | Implement file upload handler (multipart/form-data) | Photo saved to Supabase Storage |
| 6 | Implement `GET /attendance/history` | List attendance with filters |
| 7 | Implement `POST /attendance/corrections` | Request attendance correction |
| 8 | Implement `GET /attendance/corrections` | List correction requests |
| 9 | Implement correction approval endpoints | Supervisor + HRGA approval |
| 10 | Add late/early leave calculation logic | 5 min tolerance, Rp 5.000/hour |

**Key Files:**
- `src/modules/attendance/attendance.controller.ts`
- `src/modules/attendance/attendance.service.ts`
- `src/modules/attendance/dto/clock-in.dto.ts`
- `src/modules/attendance/dto/clock-out.dto.ts`
- `src/modules/attendance/dto/create-correction.dto.ts`

**Business Rules:**
- Clock in + Clock out required for attendance allowance.
- Late > 5 minutes = late status + deduction.
- GPS must be within 100m of assigned location (unless WFH/dinas).
- Photo required for clock in and clock out.

---

### Day 3: Leave & Time Off Module

**Goals:** Leave requests, balance checking, approval flow, time off requests.

| # | Task | Output |
|---|------|--------|
| 1 | Create `LeaveModule` and `TimeOffModule` | Module scaffold |
| 2 | Implement `POST /leave` | Submit leave request |
| 3 | Implement leave balance check (`GET /leave/balance`) | Check remaining days |
| 4 | Implement auto-balance deduction on approval | Update `tr_leave_balances` |
| 5 | Implement approval flow (Supervisor → HRGA) | Two-level approval |
| 6 | Implement `POST /time-off` | Submit time off request |
| 7 | Implement `GET /time-off` | List time off requests |
| 8 | Implement time off approval endpoints | Supervisor + HRGA approval |
| 9 | Add validation: annual leave only after 1 year | Contract date check |
| 10 | Add validation: cannot request if balance 0 | Reject if `remaining_days <= 0` |

**Key Files:**
- `src/modules/leave/leave.controller.ts`
- `src/modules/leave/leave.service.ts`
- `src/modules/leave/dto/create-leave.dto.ts`
- `src/modules/time-off/time-off.controller.ts`
- `src/modules/time-off/time-off.service.ts`
- `src/modules/time-off/dto/create-time-off.dto.ts`

**Business Rules:**
- Annual leave = 12 days/year, reset on Jan 1.
- Leave balance must be sufficient before request.
- Umrah leave = 30 days (special type).
- Time off does not reduce leave balance.
- Approval flow: Supervisor (Level 1) → HRGA Manager (Level 2).

---

### Day 4: Overtime Module

**Goals:** Overtime requests, rate calculation, meal allowance, approval.

| # | Task | Output |
|---|------|--------|
| 1 | Create `OvertimeModule` | Module scaffold |
| 2 | Implement `POST /overtime` | Submit overtime request (by supervisor) |
| 3 | Implement rate per hour calculation | `(base_salary + fixed_allowance) / 173` |
| 4 | Implement overtime hours rounding logic | Round up rules (see requirements) |
| 5 | Implement meal allowance calculation | Based on day type and time slots |
| 6 | Implement approval flow (Manager → HRD) | Manager approval + HRD processing |
| 7 | Implement `GET /overtime` | List overtime requests |
| 8 | Implement `GET /overtime/summary` | Summary per employee |
| 9 | Add validation: only supervisor can submit | Role check |
| 10 | Add status tracking (pending → approved → processed) | Full lifecycle |

**Key Files:**
- `src/modules/overtime/overtime.controller.ts`
- `src/modules/overtime/overtime.service.ts`
- `src/modules/overtime/dto/create-overtime.dto.ts`
- `src/modules/overtime/dto/approve-overtime.dto.ts`

**Business Rules:**
- Rate = (Gaji Pokok + Tunjangan Tetap) / 173.
- Hours rounded UP (1-30 min = 0.5h, 31-60 min = 1h, etc.).
- Meal allowance varies by day type and time (see requirements tables).
- Only supervisor/manager can submit overtime for subordinates.

---

### Day 5: Payroll Module (Mock)

**Goals:** Payslip generation endpoint with mock calculation, prorate placeholder.

| # | Task | Output |
|---|------|--------|
| 1 | Create `PayrollModule` | Module scaffold |
| 2 | Implement `GET /payroll/payslips` | List payslips for current user |
| 3 | Implement `GET /payroll/payslips/:id` | Get detailed payslip |
| 4 | Implement `POST /payroll/generate` | Generate payslip (mock calculation) |
| 5 | Implement prorate formula placeholder | `(base + allowance) / effective_days * worked_days` |
| 6 | Implement payslip structure with all components | Income + deductions breakdown |
| 7 | Implement `GET /payroll/periods` | List payroll periods |
| 8 | Implement `GET /payroll/thr` | List THR records |
| 9 | Add PDF URL generation (placeholder) | Link to Supabase Storage |
| 10 | Add status tracking (draft → published) | Admin can publish |

**Key Files:**
- `src/modules/payroll/payroll.controller.ts`
- `src/modules/payroll/payroll.service.ts`
- `src/modules/payroll/dto/generate-payslip.dto.ts`

**Business Rules:**
- Payment date: 30/31 of each month.
- Cutoff attendance/overtime: 26th - 25th.
- Prorate for new/resigned employees.
- BPJS: company paid or deducted (configurable per employee).
- PPh21: **MOCK** — return dummy value.
- BPJS calculation: **MOCK** — return dummy value.

---

### Day 6: Recruitment & Employee Module

**Goals:** Job portal CRUD, applications, employee management.

| # | Task | Output |
|---|------|--------|
| 1 | Create `RecruitmentModule` | Module scaffold |
| 2 | Implement `POST /recruitment/jobs` | Create job posting (Admin/HR) |
| 3 | Implement `GET /recruitment/jobs` | List active job postings (public) |
| 4 | Implement `GET /recruitment/jobs/:slug` | Get job detail by public slug |
| 5 | Implement `POST /recruitment/apply` | Submit job application (public) |
| 6 | Implement `GET /recruitment/applications` | List applications (Admin/HR) |
| 7 | Implement `PATCH /recruitment/applications/:id/status` | Update status (review → lolos → ditolak) |
| 8 | Create `EmployeeModule` | Module scaffold |
| 9 | Implement `GET /employees` | List employees (Admin/HR) |
| 10 | Implement `GET /employees/:id` | Get employee detail |
| 11 | Implement `PATCH /employees/:id` | Update employee data |
| 12 | Implement `GET /employees/:id/schedules` | Get employee schedule |

**Key Files:**
- `src/modules/recruitment/recruitment.controller.ts`
- `src/modules/recruitment/recruitment.service.ts`
- `src/modules/employee/employee.controller.ts`
- `src/modules/employee/employee.service.ts`

**Business Rules:**
- Job postings have public slug for sharing.
- Applications tracked with status: new → review → interview → lolos → ditolak.
- Auto-email rejection: **SKIPPED** (marked for future implementation).
- Admin/HR can edit employee data.
- Employee can view own profile only (unless Admin/HR).

---

### Day 7: Notification, Report & Deployment

**Goals:** In-app notifications, export endpoints, Render deployment.

| # | Task | Output |
|---|------|--------|
| 1 | Create `NotificationModule` | Module scaffold |
| 2 | Implement `GET /notifications` | List user notifications |
| 3 | Implement `PATCH /notifications/:id/read` | Mark as read |
| 4 | Implement `POST /notifications` | Create notification (internal) |
| 5 | Setup Supabase Realtime subscription | Live notification updates |
| 6 | Create `ReportModule` | Module scaffold |
| 7 | Implement `GET /reports/attendance` | Export attendance report (JSON) |
| 8 | Implement `GET /reports/leave` | Export leave report (JSON) |
| 9 | Implement `GET /reports/payroll` | Export payroll summary (JSON) |
| 10 | Add Excel/PDF export placeholder | Future: integrate `xlsx` / `puppeteer` |
| 11 | Create `render.yaml` | Render deployment config |
| 12 | Push to GitHub and deploy to Render | Live backend URL |
| 13 | Final Swagger docs review | Complete API documentation |
| 14 | Write `README.md` with setup instructions | Developer onboarding |

**Key Files:**
- `src/modules/notification/notification.controller.ts`
- `src/modules/notification/notification.service.ts`
- `src/modules/report/report.controller.ts`
- `render.yaml`
- `README.md`

**Business Rules:**
- Notifications linked to `tr_users`.
- Realtime updates via Supabase Realtime for new notifications.
- Reports accessible by Admin/HRD only.

---

## 4. API Design (Standard Response)

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "..."
  },
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### Headers (Required for Ktor Client)

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <supabase_jwt_token>` | From Supabase Auth |
| `Content-Type` | `application/json` | For JSON requests |
| `Content-Type` | `multipart/form-data` | For file uploads |

---

## 5. Environment Variables (.env)

```bash
# Application
NODE_ENV=development
PORT=3000
APP_NAME="HRIS Samugara"

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# JWT (Supabase)
JWT_SECRET=your-jwt-secret

# File Upload
SUPABASE_STORAGE_BUCKET=attendance-photos
MAX_FILE_SIZE=5242880
```

---

## 6. Deployment Guide (Render)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial NestJS backend"
git remote add origin https://github.com/yourusername/hris-samugara-backend.git
git push -u origin main
```

### Step 2: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository

### Step 3: Configure Service

| Setting | Value |
|---------|-------|
| Name | `hris-samugara-api` |
| Environment | `Node` |
| Build Command | `npm install && npx prisma generate` |
| Start Command | `npm run start:prod` |
| Plan | Free |

### Step 4: Add Environment Variables

Copy all variables from `.env` into Render dashboard → **Environment** tab.

### Step 5: Deploy

Click **"Create Web Service"**. Render will auto-build and deploy.

**Note:** Free tier spins down after 15 min idle. First request after idle will have ~30s cold start.

---

## 7. Database Schema (Already Provisioned)

The following tables are already created in Supabase via SQL files:

- `ms_companies`, `ms_departments`, `ms_positions`, `ms_locations`
- `ms_roles`, `ms_work_schedules`, `ms_leave_types`, `ms_time_off_types`
- `ms_overtime_meal_allowances`, `ms_holiday_calendars`, `ms_job_postings`
- `tr_users`, `tr_employees`, `tr_employee_schedules`
- `tr_attendances`, `tr_attendance_corrections`
- `tr_leave_balances`, `tr_leave_requests`, `tr_time_off_requests`
- `tr_overtime_requests`, `tr_payroll_periods`, `tr_payslips`
- `tr_loan_deductions`, `tr_thr_records`, `tr_job_applications`
- `tr_approvals`, `tr_notifications`, `tr_audit_logs`

**Prisma will introspect these tables via `npx prisma db pull`.**

---

## 8. Roles & Permissions

| Role | Permissions |
|------|-------------|
| `karyawan` | Clock in/out, view own data, request leave/time-off, view own payslip |
| `atasan` | All `karyawan` + approve subordinate requests, submit overtime |
| `manager_hrga` | All `atasan` + approve level 2, manage employee schedules |
| `hrd` | View all attendance, process overtime, manage payroll periods |
| `admin` | All `hrd` + CRUD employees, edit any request, manage job postings |
| `super_admin` | Full access, including system settings |

---

## 9. File Upload Strategy (Option A)

```
Mobile (KMP) → multipart/form-data → NestJS Backend → Supabase Storage
                                                    ↓
                                              Return public URL
                                              Save URL to DB
```

**Endpoints:**
- `POST /attendance/clock-in` — accepts `photo` (file) + `lat`, `lng` (JSON)
- `POST /attendance/clock-out` — same as above
- `POST /leave` — accepts `attachment` (file, optional)

**Supabase Storage Buckets:**
- `attendance-photos/{user_id}/{date}_clock_in.jpg`
- `attendance-photos/{user_id}/{date}_clock_out.jpg`
- `documents/{user_id}/sick_note_{date}.pdf`

---

## 10. Mocked Features (To be Implemented Manually Later)

| Feature | Current Implementation | Future Plan |
|---------|------------------------|-------------|
| PPh21 Calculation | Return fixed dummy value | Implement tax brackets formula |
| BPJS Calculation | Return fixed dummy value | Integrate BPJS rate API/table |
| Email (Recruitment) | Skip / return success | Integrate SendGrid/SMTP |
| Push Notification | Skip / in-app only | Integrate FCM / OneSignal |
| Excel/PDF Export | JSON response only | Integrate `xlsx` / `puppeteer` |
| Payroll Auto-Generate | Manual trigger endpoint | Cron job monthly |

---

## 11. Testing Strategy

| Type | Scope | Tool |
|------|-------|------|
| Unit Tests | Services, Utilities | Jest |
| E2E Tests | Full HTTP request flow | Jest + Supertest |
| Manual Testing | Swagger UI | Browser |
| Mobile Integration | Ktor client against API | Android Studio / Xcode |

---

## 12. Success Criteria

- [ ] All endpoints return standard `{ success, data, message, meta }` format
- [ ] Swagger docs accessible at `/api/docs`
- [ ] JWT authentication working with Supabase
- [ ] Role-based access control enforced
- [ ] File upload to Supabase Storage working
- [ ] Deployed and accessible on Render
- [ ] KMP mobile app can consume all endpoints
- [ ] React web app can consume all endpoints

---

*Plan created for HRIS Samugara Backend — NestJS Clean Architecture.*
*Ready to execute Day 1.*
