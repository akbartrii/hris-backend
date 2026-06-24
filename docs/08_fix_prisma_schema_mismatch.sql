-- =============================================================================
-- HRIS SAMUGARA - FIX PRISMA SCHEMA MISMATCH
-- File: 08_fix_prisma_schema_mismatch.sql
-- Description: Memperbaiki perbedaan antara Prisma schema dan database aktual
--              (kolom yang hilang + tipe data yang tidak cocok)
-- =============================================================================

-- =============================================================================
-- 1. FIX: ms_employees — salary columns harus VARCHAR (encrypted), bukan DECIMAL
--    base_salary, fixed_allowance, phone_allowance, dinas_allowance
-- =============================================================================
ALTER TABLE ms_employees DROP CONSTRAINT IF EXISTS ms_employees_base_salary_check;
ALTER TABLE ms_employees DROP CONSTRAINT IF EXISTS ms_employees_fixed_allowance_check;
ALTER TABLE ms_employees DROP CONSTRAINT IF EXISTS ms_employees_phone_allowance_check;
ALTER TABLE ms_employees DROP CONSTRAINT IF EXISTS ms_employees_dinas_allowance_check;

ALTER TABLE ms_employees ALTER COLUMN base_salary TYPE VARCHAR(255);
ALTER TABLE ms_employees ALTER COLUMN fixed_allowance TYPE VARCHAR(255) DEFAULT '0';
ALTER TABLE ms_employees ALTER COLUMN phone_allowance TYPE VARCHAR(255) DEFAULT '0';
ALTER TABLE ms_employees ALTER COLUMN dinas_allowance TYPE VARCHAR(255) DEFAULT '0';

-- =============================================================================
-- 2. ADD: ms_employees — kolom Prisma yang hilang
-- =============================================================================
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS current_remote_work_id UUID;
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS ptkp_status VARCHAR(50) DEFAULT 'TK/0';
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS npwp VARCHAR(50);
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255);
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS face_registration_status VARCHAR(50) DEFAULT 'not_registered';

CREATE INDEX IF NOT EXISTS idx_employees_current_remote_work ON ms_employees(current_remote_work_id);

-- =============================================================================
-- 3. FIX: tr_time_off_requests — Prisma pakai start_date/end_date, bukan date
-- =============================================================================
ALTER TABLE tr_time_off_requests ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE tr_time_off_requests ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE tr_time_off_requests ADD COLUMN IF NOT EXISTS work_handover_to UUID;

UPDATE tr_time_off_requests SET start_date = date, end_date = date WHERE start_date IS NULL;

-- =============================================================================
-- 4. FIX: tr_leave_requests — missing work_handover_to
-- =============================================================================
ALTER TABLE tr_leave_requests ADD COLUMN IF NOT EXISTS work_handover_to UUID;

-- =============================================================================
-- 5. FIX: tr_payslips — missing bpjs_jp, reimbursement_amount, unpaid_leave_deduction
-- =============================================================================
ALTER TABLE tr_payslips ADD COLUMN IF NOT EXISTS bpjs_jp DECIMAL(15,2) DEFAULT 0;
ALTER TABLE tr_payslips ADD COLUMN IF NOT EXISTS reimbursement_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE tr_payslips ADD COLUMN IF NOT EXISTS unpaid_leave_deduction DECIMAL(15,2) DEFAULT 0;

-- =============================================================================
-- 6. FIX: tr_overtime_requests — missing type column
-- =============================================================================
ALTER TABLE tr_overtime_requests ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- =============================================================================
-- 7. FIX: tr_attendances — pastikan late_deduction ada
-- =============================================================================
ALTER TABLE tr_attendances ADD COLUMN IF NOT EXISTS late_deduction DECIMAL(15,2) DEFAULT 0;
