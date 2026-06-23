-- =============================================================================
-- HRIS SAMUGARA - FIX MISSING PRISMA COLUMNS
-- File: 08_fix_missing_prisma_columns.sql
-- Description: Menambahkan kolom-kolom dari Prisma schema yang tidak ada
--              di 01_schema.sql (raw SQL)
-- =============================================================================

-- =============================================================================
-- 1. ms_employees — missing columns from Prisma
-- =============================================================================
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS current_remote_work_id UUID;
CREATE INDEX IF NOT EXISTS idx_employees_current_remote_work ON ms_employees(current_remote_work_id);

ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS ptkp_status VARCHAR(50) DEFAULT 'TK/0';
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS npwp VARCHAR(50);
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255);
ALTER TABLE ms_employees ADD COLUMN IF NOT EXISTS face_registration_status VARCHAR(50) DEFAULT 'not_registered';

-- =============================================================================
-- 2. tr_time_off_requests — Prisma uses start_date/end_date instead of date
-- =============================================================================
ALTER TABLE tr_time_off_requests ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE tr_time_off_requests ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE tr_time_off_requests ADD COLUMN IF NOT EXISTS work_handover_to UUID;

-- Copy existing date column into start_date and end_date
UPDATE tr_time_off_requests SET start_date = date, end_date = date WHERE start_date IS NULL;

-- =============================================================================
-- 3. tr_leave_requests — missing work_handover_to
-- =============================================================================
ALTER TABLE tr_leave_requests ADD COLUMN IF NOT EXISTS work_handover_to UUID;

-- =============================================================================
-- 4. tr_payslips — missing bpjs_jp, reimbursement_amount, unpaid_leave_deduction
-- =============================================================================
ALTER TABLE tr_payslips ADD COLUMN IF NOT EXISTS bpjs_jp DECIMAL(15,2) DEFAULT 0;
ALTER TABLE tr_payslips ADD COLUMN IF NOT EXISTS reimbursement_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE tr_payslips ADD COLUMN IF NOT EXISTS unpaid_leave_deduction DECIMAL(15,2) DEFAULT 0;

-- =============================================================================
-- 5. tr_overtime_requests — missing type column
-- =============================================================================
ALTER TABLE tr_overtime_requests ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- All missing Prisma columns have been added
