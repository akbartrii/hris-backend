-- SQL Fix: Add 'supervisor_approved' status to CHECK constraints
-- Run this in Supabase SQL Editor

-- Fix tr_leave_requests status constraint
DO $$
BEGIN
    -- Drop existing constraint if exists
    ALTER TABLE tr_leave_requests 
    DROP CONSTRAINT IF EXISTS tr_leave_requests_status_check;
    
    -- Recreate with valid statuses including supervisor_approved
    ALTER TABLE tr_leave_requests 
    ADD CONSTRAINT tr_leave_requests_status_check 
    CHECK (status IN ('pending', 'supervisor_approved', 'approved', 'rejected', 'cancelled'));
    
    RAISE NOTICE 'Fixed tr_leave_requests status constraint';
END $$;

-- Fix tr_overnight_requests status constraint (if exists)
DO $$
BEGIN
    ALTER TABLE tr_overnight_requests 
    DROP CONSTRAINT IF EXISTS tr_overnight_requests_status_check;
    
    ALTER TABLE tr_overnight_requests 
    ADD CONSTRAINT tr_overnight_requests_status_check 
    CHECK (status IN ('pending', 'supervisor_approved', 'approved', 'rejected', 'cancelled'));
    
    RAISE NOTICE 'Fixed tr_overnight_requests status constraint';
END $$;

-- Fix tr_reimbursements status constraint (if exists)
DO $$
BEGIN
    ALTER TABLE tr_reimbursements 
    DROP CONSTRAINT IF EXISTS tr_reimbursements_status_check;
    
    ALTER TABLE tr_reimbursements 
    ADD CONSTRAINT tr_reimbursements_status_check 
    CHECK (status IN ('pending', 'supervisor_approved', 'approved', 'rejected', 'cancelled'));
    
    RAISE NOTICE 'Fixed tr_reimbursements status constraint';
END $$;

-- Verify constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
WHERE 
    tc.constraint_type = 'CHECK'
    AND tc.table_name IN ('tr_leave_requests', 'tr_overnight_requests', 'tr_reimbursements')
ORDER BY tc.table_name;
