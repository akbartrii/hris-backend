# HRIS Samugara — Supabase Integration Guide

> **Target:** Deploy PostgreSQL schema + seed data ke Supabase, integrate Auth, Storage, Realtime, dan RLS untuk prototype HRIS.

---

## 1. Setup Supabase Project

### 1.1 Buat Project Baru
1. Login ke [https://app.supabase.com](https://app.supabase.com)
2. Klik **"New Project"**
3. Pilih Organization (bisa personal)
4. Isi:
   - **Name:** `hris-samugara-prototype`
   - **Database Password:** *(generate strong password, simpan!)*
   - **Region:** `Southeast Asia (Singapore)` *(terdekat dengan Indonesia)*
5. Klik **"Create new project"**
6. Tunggu ~2 menit sampai provisioning selesai

### 1.2 Simpan Project Credentials
Setelah project aktif, masuk ke **Settings → Database**:

| Field | Value Contoh |
|-------|-------------|
| Host | `db.xxxxxxxxxxxxxxxxxxxx.supabase.co` |
| Database | `postgres` |
| Port | `5432` |
| User | `postgres` |
| Password | *(password yang dibuat saat setup)* |
| Connection String | `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres` |

Simpan juga dari **Settings → API**:

| Field | Value |
|-------|-------|
| Project URL | `https://xxxxxxxxxxxxxxxxxxxx.supabase.co` |
| anon public | `eyJhbGciOiJIUzI1NiIs...` *(untuk frontend)* |
| service_role secret | `eyJhbGciOiJIUzI1NiIs...` *(untuk backend/admin, jangan expose!)* |

---

## 2. Jalankan SQL Files

### 2.1 Via Supabase SQL Editor (Recommended)

1. Buka project → menu **"SQL Editor"** (sidebar kiri)
2. Klik **"New query"**
3. **Paste isi file `01_schema.sql`**
4. Klik **"Run"** (tombol hijau atau `Ctrl+Enter`)
5. Ulangi untuk file berikutnya **secara berurutan**:
   - `02_triggers.sql`
   - `03_views.sql`
   - `04_seed_master.sql`
   - `05_seed_dummy.sql`

### 2.2 Via psql CLI (Alternative)

```bash
# Export connection string dari Supabase Dashboard → Database Settings
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxxxxxxxxx.supabase.co:5432/postgres"

# Jalankan berurutan
psql $SUPABASE_DB_URL -f database/01_schema.sql
psql $SUPABASE_DB_URL -f database/02_triggers.sql
psql $SUPABASE_DB_URL -f database/03_views.sql
psql $SUPABASE_DB_URL -f database/04_seed_master.sql
psql $SUPABASE_DB_URL -f database/05_seed_dummy.sql
```

### 2.3 Verifikasi

```sql
-- Cek tabel sudah terbuat
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'ms_%' OR tablename LIKE 'tr_%';

-- Cek seed data
SELECT * FROM ms_companies;
SELECT * FROM tr_users LIMIT 5;
SELECT * FROM vw_employee_summary;
```

---

## 3. Supabase Auth Integration

### 3.1 Enable Auth Providers

1. Buka **Authentication → Providers**
2. Enable **Email** (default sudah on)
3. *(Opsional)* Enable **Google OAuth** atau lainnya untuk SSO

### 3.2 Integrasi `tr_users` dengan `auth.users`

Supabase sudah punya tabel `auth.users` built-in. Kita akan link `tr_users` dengan `auth.users` via **Trigger**.

#### Step 1: Tambah kolom `auth_user_id` ke `tr_users`

```sql
ALTER TABLE tr_users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_tr_users_auth ON tr_users(auth_user_id);
```

#### Step 2: Trigger auto-create `tr_users` saat signup

```sql
-- Function: Saat user signup di Supabase Auth, auto-create di tr_users
CREATE OR REPLACE FUNCTION fn_handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_role_id UUID;
BEGIN
    -- Ambil default company & role karyawan
    SELECT id INTO v_company_id FROM ms_companies LIMIT 1;
    SELECT id INTO v_role_id FROM ms_roles WHERE name = 'karyawan' LIMIT 1;

    INSERT INTO tr_users (
        auth_user_id,
        role_id,
        company_id,
        email,
        full_name,
        is_active
    ) VALUES (
        NEW.id,
        v_role_id,
        v_company_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        true
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger setelah insert ke auth.users
CREATE TRIGGER trg_auth_users_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION fn_handle_new_auth_user();
```

#### Step 3: Link existing users (setelah seed dummy)

```sql
-- Buat dummy auth.users untuk data seed yang sudah ada
-- Password default: "password123" (bcrypt hashed)

-- Admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
    gen_random_uuid(),
    'admin@samugara.co.id',
    '$2a$10$abcdefghijklmnopqrstuv', -- bcrypt hash
    NOW(),
    '{"full_name":"Admin HRIS"}'
)
ON CONFLICT (email) DO NOTHING;

-- Lalu update tr_users.auth_user_id ...
```

### 3.3 Custom Claims / JWT Metadata

Supabase Auth menyematkan JWT claims. Kita bisa tambahkan role dari `tr_users`:

```sql
-- Function untuk extract role dari tr_users
CREATE OR REPLACE FUNCTION fn_get_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.name INTO v_role_name
    FROM tr_users u
    JOIN ms_roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid();
    
    RETURN v_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Supabase Storage (File Uploads)

### 4.1 Create Buckets

1. Buka **Storage → Buckets → New Bucket**
2. Buat 3 bucket:

| Bucket Name | Access | Purpose |
|-------------|--------|---------|
| `attendance-photos` | `authenticated` | Foto selfie clock in/out |
| `payslips` | `authenticated` | PDF slip gaji |
| `documents` | `authenticated` | Surat dokter, lampiran cuti |

### 4.2 Upload Policy (RLS)

```sql
-- Policy: User hanya bisa upload foto absensi milik sendiri
CREATE POLICY "Users can upload their own attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'attendance-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: User hanya bisa lihat foto absensi milik sendiri
CREATE POLICY "Users can view their own attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'attendance-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admin/HR bisa lihat semua payslip
CREATE POLICY "HR can view all payslips"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payslips'
    AND EXISTS (
        SELECT 1 FROM tr_users u
        JOIN ms_roles r ON u.role_id = r.id
        WHERE u.auth_user_id = auth.uid()
        AND r.name IN ('hrd', 'admin', 'super_admin')
    )
);

-- Policy: User hanya bisa lihat payslip sendiri
CREATE POLICY "Users can view their own payslips"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payslips'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4.3 Folder Structure

```
attendance-photos/
├── {auth_user_id}/
│   ├── 2026-04-05_clock_in.jpg
│   ├── 2026-04-05_clock_out.jpg
│   └── ...

payslips/
├── {auth_user_id}/
│   ├── 2026-03.pdf
│   ├── 2026-04.pdf
│   └── ...

documents/
├── {auth_user_id}/
│   ├── sick_note_2026-04-25.pdf
│   └── ...
```

---

## 5. Row Level Security (RLS) Policies

### 5.1 Enable RLS pada Semua Tabel Transaksi

```sql
-- Enable RLS
ALTER TABLE tr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_notifications ENABLE ROW LEVEL SECURITY;
```

### 5.2 Helper Functions

```sql
-- Cek apakah user adalah admin/super_admin
CREATE OR REPLACE FUNCTION fn_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tr_users u
        JOIN ms_roles r ON u.role_id = r.id
        WHERE u.auth_user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cek apakah user adalah HRD
CREATE OR REPLACE FUNCTION fn_is_hrd()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tr_users u
        JOIN ms_roles r ON u.role_id = r.id
        WHERE u.auth_user_id = auth.uid()
        AND r.name = 'hrd'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cek apakah user adalah manager dari employee X
CREATE OR REPLACE FUNCTION fn_is_manager_of(p_employee_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tr_employees e
        JOIN tr_users u ON e.id = (
            SELECT employee_id FROM tr_users WHERE auth_user_id = auth.uid()
        )
        WHERE e.id = p_employee_id
        AND (e.supervisor_id = u.employee_id OR e.manager_id = u.employee_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's employee_id
CREATE OR REPLACE FUNCTION fn_get_current_employee_id()
RETURNS UUID AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    SELECT employee_id INTO v_employee_id
    FROM tr_users WHERE auth_user_id = auth.uid();
    RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 RLS Policies per Tabel

#### `tr_users`
```sql
-- User bisa lihat data sendiri
CREATE POLICY "Users can view own data"
ON tr_users FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid() OR fn_is_admin());

-- Admin bisa edit semua
CREATE POLICY "Admin can manage all users"
ON tr_users FOR ALL
TO authenticated
USING (fn_is_admin());
```

#### `tr_employees`
```sql
-- User bisa lihat data sendiri
CREATE POLICY "Employees can view own profile"
ON tr_employees FOR SELECT
TO authenticated
USING (id = fn_get_current_employee_id() OR fn_is_admin() OR fn_is_hrd());

-- Supervisor bisa lihat bawahannya
CREATE POLICY "Supervisors can view subordinates"
ON tr_employees FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT id FROM tr_employees 
        WHERE supervisor_id = fn_get_current_employee_id() 
        OR manager_id = fn_get_current_employee_id()
    )
);
```

#### `tr_attendances`
```sql
-- User bisa lihat absensi sendiri
CREATE POLICY "Employees can view own attendance"
ON tr_attendances FOR SELECT
TO authenticated
USING (employee_id = fn_get_current_employee_id());

-- Admin/HR bisa lihat semua
CREATE POLICY "HR can view all attendance"
ON tr_attendances FOR ALL
TO authenticated
USING (fn_is_admin() OR fn_is_hrd());
```

#### `tr_leave_requests`
```sql
-- User bisa CRUD cuti sendiri
CREATE POLICY "Employees can manage own leave"
ON tr_leave_requests FOR ALL
TO authenticated
USING (employee_id = fn_get_current_employee_id());

-- Supervisor bisa approve
CREATE POLICY "Supervisors can view subordinate leaves"
ON tr_leave_requests FOR SELECT
TO authenticated
USING (
    employee_id IN (
        SELECT id FROM tr_employees 
        WHERE supervisor_id = fn_get_current_employee_id()
    )
);

-- HR bisa lihat semua
CREATE POLICY "HR can manage all leaves"
ON tr_leave_requests FOR ALL
TO authenticated
USING (fn_is_hrd() OR fn_is_admin());
```

*(Pola yang sama untuk `tr_time_off_requests`, `tr_overtime_requests`, `tr_payslips`, dll)*

#### `tr_notifications`
```sql
-- User hanya bisa lihat notifikasi sendiri
CREATE POLICY "Users can view own notifications"
ON tr_notifications FOR SELECT
TO authenticated
USING (user_id = (SELECT id FROM tr_users WHERE auth_user_id = auth.uid()));
```

---

## 6. Supabase Realtime (Live Notifications)

### 6.1 Enable Realtime pada Tabel

```sql
-- Enable realtime untuk notifications & approvals
ALTER PUBLICATION supabase_realtime ADD TABLE tr_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tr_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE tr_leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tr_time_off_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tr_overtime_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tr_attendance_corrections;
```

### 6.2 Frontend Subscription Example (JavaScript)

```javascript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe notifikasi real-time
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'tr_notifications',
      filter: `user_id=eq.${currentUserId}`
    },
    (payload) => {
      console.log('New notification:', payload.new);
      // Show toast/push notification
    }
  )
  .subscribe();

// Subscribe approval updates
const approvalSub = supabase
  .channel('approvals')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tr_leave_requests' },
    (payload) => {
      // Refresh approval center
    }
  )
  .subscribe();
```

---

## 7. Auto-Generated API (PostgREST)

Supabase otomatis generate REST API dari semua tabel. Base URL:
```
https://xxxxxxxxxxxxxxxxxxxx.supabase.co/rest/v1/
```

### 7.1 Contoh API Calls

#### Get Employee Profile
```bash
curl -X GET 'https://xxxx.supabase.co/rest/v1/vw_employee_summary?nik=eq.TG001' \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

#### Get Attendance History
```bash
curl -X GET 'https://xxxx.supabase.co/rest/v1/tr_attendances?employee_id=eq.${EMP_ID}&order=attendance_date.desc' \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

#### Submit Leave Request
```bash
curl -X POST 'https://xxxx.supabase.co/rest/v1/tr_leave_requests' \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "uuid-here",
    "leave_type_id": "uuid-here",
    "start_date": "2026-05-10",
    "end_date": "2026-05-12",
    "total_days": 3,
    "reason": "Mudik Lebaran"
  }'
```

#### Get Pending Approvals (for Manager)
```bash
curl -X GET 'https://xxxx.supabase.co/rest/v1/vw_pending_approvals' \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 7.2 Supabase Client SDK (Recommended)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'budi.santoso@samugara.co.id',
  password: 'password123'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Query with RLS (auto-filtered)
const { data: attendances } = await supabase
  .from('tr_attendances')
  .select('*')
  .order('attendance_date', { ascending: false });

// Insert attendance
const { data, error } = await supabase
  .from('tr_attendances')
  .insert({
    employee_id: 'uuid',
    attendance_date: '2026-04-25',
    clock_in: '2026-04-25T07:55:00+07:00',
    location_id: 'uuid'
  });

// Upload photo
const { data: uploadData } = await supabase
  .storage
  .from('attendance-photos')
  .upload(`${user.id}/2026-04-25_clock_in.jpg`, file);

// Get public URL
const { data: { publicUrl } } = supabase
  .storage
  .from('attendance-photos')
  .getPublicUrl(`${user.id}/2026-04-25_clock_in.jpg`);
```

---

## 8. Environment Variables

Simpan di `.env` (jangan commit!):

```bash
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Database (untuk migrations/DDL)
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxxxxxxxxx.supabase.co:5432/postgres

# App
APP_NAME="HRIS Samugara"
APP_ENV=development
```

---

## 9. Checklist Deployment

### Phase 1: Database Setup
- [ ] Buat project Supabase baru
- [ ] Simpan credentials
- [ ] Jalankan `01_schema.sql`
- [ ] Jalankan `02_triggers.sql`
- [ ] Jalankan `03_views.sql`
- [ ] Jalankan `04_seed_master.sql`
- [ ] Jalankan `05_seed_dummy.sql`
- [ ] Verifikasi tabel & seed data

### Phase 2: Auth Setup
- [ ] Enable Email auth provider
- [ ] Tambah `auth_user_id` ke `tr_users`
- [ ] Jalankan trigger `fn_handle_new_auth_user`
- [ ] Test signup → cek auto-create di `tr_users`

### Phase 3: Storage Setup
- [ ] Buat bucket `attendance-photos`
- [ ] Buat bucket `payslips`
- [ ] Buat bucket `documents`
- [ ] Set RLS policies untuk storage
- [ ] Test upload file

### Phase 4: RLS Setup
- [ ] Enable RLS di semua tabel transaksi
- [ ] Jalankan helper functions (`fn_is_admin`, `fn_get_current_employee_id`, dll)
- [ ] Apply policies per tabel
- [ ] Test: user A tidak boleh lihat data user B
- [ ] Test: admin bisa lihat semua

### Phase 5: Realtime Setup
- [ ] Enable realtime publication untuk tabel kunci
- [ ] Test subscription dari frontend
- [ ] Verifikasi notifikasi real-time

### Phase 6: Integration Testing
- [ ] Test login/logout
- [ ] Test clock in/out (insert attendance)
- [ ] Test submit leave request
- [ ] Test approval flow (supervisor → HRGA)
- [ ] Test file upload (foto absensi)
- [ ] Test view payslip
- [ ] Test real-time notification

---

## 10. Troubleshooting

### Issue: "relation does not exist"
**Solusi:** Pastikan SQL files dijalankan berurutan. Schema harus jalan dulu.

### Issue: "permission denied for schema public"
**Solusi:** Di Supabase, user `postgres` sudah owner. Kalau pakai service_role key, pastikan key benar.

### Issue: RLS blocking valid requests
**Solusi:** Cek `auth.uid()` return NULL → user belum login. Pastikan JWT token valid.

### Issue: Realtime tidak berfungsi
**Solusi:**
```sql
-- Cek publication
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Cek tabel sudah masuk publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Issue: Storage upload gagal (RLS)
**Solusi:** Pastikan folder path sesuai policy. Contoh: `{auth_user_id}/filename.jpg`.

### Issue: Seed data tidak masuk
**Solusi:** Cek apakah ada constraint violation. Supabase log ada di **Database → Logs**.

---

## 11. Cost Estimation (Prototype Phase)

| Resource | Free Tier | Estimasi Penggunaan |
|----------|-----------|---------------------|
| Database | 500MB | ~50MB (25 tabel + seed) |
| Storage | 1GB | ~100MB (foto + PDF) |
| Bandwidth | 2GB/mo | ~500MB (prototype) |
| Auth MAU | 50,000 | <10 user |
| **Total** | **$0** | ✅ **Gratis** |

---

## 12. Next Steps (Production)

1. **Upgrade ke Pro** ($25/mo) kalau butuh:
   - Database > 500MB
   - Daily backups
   - Priority support
   - Custom domains

2. **Add Edge Functions** (Supabase Functions) untuk:
   - Payroll calculation (background job)
   - Email notifications
   - BPJS integration

3. **Monitoring**:
   - Supabase Dashboard → Reports
   - Enable Logflare untuk query performance

---

*Integration guide ini dibuat untuk HRIS Samugara prototype deployment ke Supabase.*
