-- Seed Users for All Roles
-- Run this in Supabase SQL Editor
-- Password for all: password123
-- Generated: 2026-05-02

DO $$
DECLARE
  v_company_id UUID := 'e135435b-cac1-4e79-af75-5c0f2bfdb8fd';
  v_dept_id UUID := '04e95cc5-3ccb-412c-b948-90f89ea0a5d6'; -- HRGA dept
  v_position_id UUID := '4bac3ff8-be44-4d39-8bdb-812049daebf1'; -- System Admin position
  v_location_id UUID := '76cd4d53-6ac5-45bb-a893-8f9e13eade29'; -- Default location
  v_karyawan_role_id UUID;
  v_atasan_role_id UUID;
  v_manager_hrga_role_id UUID;
  v_hrd_role_id UUID;
  v_admin_role_id UUID;
  v_super_admin_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO v_karyawan_role_id FROM ms_roles WHERE name = 'karyawan';
  SELECT id INTO v_atasan_role_id FROM ms_roles WHERE name = 'atasan';
  SELECT id INTO v_manager_hrga_role_id FROM ms_roles WHERE name = 'manager_hrga';
  SELECT id INTO v_hrd_role_id FROM ms_roles WHERE name = 'hrd';
  SELECT id INTO v_admin_role_id FROM ms_roles WHERE name = 'admin';
  SELECT id INTO v_super_admin_role_id FROM ms_roles WHERE name = 'super_admin';

  -- 1. Karyawan
  IF NOT EXISTS (SELECT 1 FROM tr_users WHERE email = 'karyawan@samugara.co.id') THEN
    INSERT INTO tr_users (id, role_id, company_id, employee_id, email, password_hash, full_name, phone, is_active)
    VALUES (
      '3b6a63d3-04ee-49cd-bacd-4844d1b03100',
      v_karyawan_role_id,
      v_company_id,
      'EMP_KAR',
      'karyawan@samugara.co.id',
      '$2b$10$6/0nbNueF6pcr63/SkXrgOKjFm1ioqlWt6avxpfa5DQhZthcSkzUO',
      'Karyawan Test',
      '081234567001',
      true
    );
    
    INSERT INTO tr_employees (id, user_id, department_id, position_id, location_id, nik, full_name, gender, employment_status, join_date, is_active)
    VALUES (
      '3b6a63d3-04ee-49cd-bacd-4844d1b03101',
      '3b6a63d3-04ee-49cd-bacd-4844d1b03100',
      v_dept_id,
      v_position_id,
      v_location_id,
      'EMP_KAR',
      'Karyawan Test',
      'male',
      'permanen',
      '2024-01-01',
      true
    );
  END IF;

  -- 2. Supervisor/Atasan
  IF NOT EXISTS (SELECT 1 FROM tr_users WHERE email = 'spv@samugara.co.id') THEN
    INSERT INTO tr_users (id, role_id, company_id, employee_id, email, password_hash, full_name, phone, is_active)
    VALUES (
      'b216edb8-15e0-4c87-ac9b-fbb610ad0a48',
      v_atasan_role_id,
      v_company_id,
      'EMP_SPV',
      'spv@samugara.co.id',
      '$2b$10$6/0nbNueF6pcr63/SkXrgOKjFm1ioqlWt6avxpfa5DQhZthcSkzUO',
      'Supervisor Test',
      '081234567002',
      true
    );
    
    INSERT INTO tr_employees (id, user_id, department_id, position_id, location_id, nik, full_name, gender, employment_status, join_date, is_active)
    VALUES (
      'b216edb8-15e0-4c87-ac9b-fbb610ad0a49',
      'b216edb8-15e0-4c87-ac9b-fbb610ad0a48',
      v_dept_id,
      v_position_id,
      v_location_id,
      'EMP_SPV',
      'Supervisor Test',
      'male',
      'permanen',
      '2023-01-01',
      true
    );
  END IF;

  -- 3. Manager HRGA (if not exists with this email)
  IF NOT EXISTS (SELECT 1 FROM tr_users WHERE email = 'hrga@samugara.co.id') THEN
    INSERT INTO tr_users (id, role_id, company_id, employee_id, email, password_hash, full_name, phone, is_active)
    VALUES (
      '493421e0-265b-4a28-aa76-d11a684dc14c',
      v_manager_hrga_role_id,
      v_company_id,
      'EMP_HRGA',
      'hrga@samugara.co.id',
      '$2b$10$6/0nbNueF6pcr63/SkXrgOKjFm1ioqlWt6avxpfa5DQhZthcSkzUO',
      'Manager HRGA Test',
      '081234567003',
      true
    );
    
    INSERT INTO tr_employees (id, user_id, department_id, position_id, location_id, nik, full_name, gender, employment_status, join_date, is_active)
    VALUES (
      '493421e0-265b-4a28-aa76-d11a684dc14d',
      '493421e0-265b-4a28-aa76-d11a684dc14c',
      v_dept_id,
      v_position_id,
      v_location_id,
      'EMP_HRGA',
      'Manager HRGA Test',
      'male',
      'permanen',
      '2022-01-01',
      true
    );
  END IF;

  -- 4. HRD
  IF NOT EXISTS (SELECT 1 FROM tr_users WHERE email = 'hrd@samugara.co.id') THEN
    INSERT INTO tr_users (id, role_id, company_id, employee_id, email, password_hash, full_name, phone, is_active)
    VALUES (
      'b4e31950-9a94-4f9a-baf3-8786602345ce',
      v_hrd_role_id,
      v_company_id,
      'EMP_HRD',
      'hrd@samugara.co.id',
      '$2b$10$6/0nbNueF6pcr63/SkXrgOKjFm1ioqlWt6avxpfa5DQhZthcSkzUO',
      'HRD Test',
      '081234567004',
      true
    );
    
    INSERT INTO tr_employees (id, user_id, department_id, position_id, location_id, nik, full_name, gender, employment_status, join_date, is_active)
    VALUES (
      'b4e31950-9a94-4f9a-baf3-8786602345cf',
      'b4e31950-9a94-4f9a-baf3-8786602345ce',
      v_dept_id,
      v_position_id,
      v_location_id,
      'EMP_HRD',
      'HRD Test',
      'male',
      'permanen',
      '2022-01-01',
      true
    );
  END IF;

  -- 5. Admin (regular admin, not super_admin)
  -- Note: admin@samugara.co.id currently has super_admin role
  -- We will create admin-role@samugara.co.id for admin role to keep both
  IF NOT EXISTS (SELECT 1 FROM tr_users WHERE email = 'admin-role@samugara.co.id') THEN
    INSERT INTO tr_users (id, role_id, company_id, employee_id, email, password_hash, full_name, phone, is_active)
    VALUES (
      'c175959f-f09f-4a82-bdcd-0bec1b07491f',
      v_admin_role_id,
      v_company_id,
      'EMP_ADMIN',
      'admin-role@samugara.co.id',
      '$2b$10$6/0nbNueF6pcr63/SkXrgOKjFm1ioqlWt6avxpfa5DQhZthcSkzUO',
      'Admin Test',
      '081234567005',
      true
    );
    
    INSERT INTO tr_employees (id, user_id, department_id, position_id, location_id, nik, full_name, gender, employment_status, join_date, is_active)
    VALUES (
      'c175959f-f09f-4a82-bdcd-0bec1b074920',
      'c175959f-f09f-4a82-bdcd-0bec1b07491f',
      v_dept_id,
      v_position_id,
      v_location_id,
      'EMP_ADMIN',
      'Admin Test',
      'male',
      'permanen',
      '2022-01-01',
      true
    );
  END IF;

  -- 6. Super Admin
  IF NOT EXISTS (SELECT 1 FROM tr_users WHERE email = 'superadmin@samugara.co.id') THEN
    INSERT INTO tr_users (id, role_id, company_id, employee_id, email, password_hash, full_name, phone, is_active)
    VALUES (
      '82c61552-9066-4cf5-98d8-cc67950835fc',
      v_super_admin_role_id,
      v_company_id,
      'EMP_SA',
      'superadmin@samugara.co.id',
      '$2b$10$6/0nbNueF6pcr63/SkXrgOKjFm1ioqlWt6avxpfa5DQhZthcSkzUO',
      'Super Admin Test',
      '081234567006',
      true
    );
    
    INSERT INTO tr_employees (id, user_id, department_id, position_id, location_id, nik, full_name, gender, employment_status, join_date, is_active)
    VALUES (
      '82c61552-9066-4cf5-98d8-cc67950835fd',
      '82c61552-9066-4cf5-98d8-cc67950835fc',
      v_dept_id,
      v_position_id,
      v_location_id,
      'EMP_SA',
      'Super Admin Test',
      'male',
      'permanen',
      '2022-01-01',
      true
    );
  END IF;

  RAISE NOTICE 'Users created successfully!';
END $$;

-- ============================================================
-- SEED TEST DATA FOR karyawan@samugara.co.id
-- ============================================================

DO $$
DECLARE
  v_karyawan_emp_id UUID := '3b6a63d3-04ee-49cd-bacd-4844d1b03101';
  v_spv_emp_id UUID := 'b216edb8-15e0-4c87-ac9b-fbb610ad0a49';
  v_location_id UUID := '76cd4d53-6ac5-45bb-a893-8f9e13eade29';
  v_leave_type_id UUID := '2510d5e6-5d06-4044-b504-31b19c939375'; -- Cuti Tahunan
  v_company_id UUID := 'e135435b-cac1-4e79-af75-5c0f2bfdb8fd';
BEGIN
  -- 1. Set supervisor for karyawan
  UPDATE tr_employees 
  SET supervisor_id = v_spv_emp_id 
  WHERE id = v_karyawan_emp_id;

  -- 2. Leave Balance (Cuti Tahunan 2026)
  IF NOT EXISTS (SELECT 1 FROM tr_leave_balances WHERE employee_id = v_karyawan_emp_id AND leave_type_id = v_leave_type_id AND year = 2026) THEN
    INSERT INTO tr_leave_balances (id, employee_id, leave_type_id, year, total_days, used_days)
    VALUES ('c5321715-b087-41be-b0d9-2daff81c69e1', v_karyawan_emp_id, v_leave_type_id, 2026, 12, 0);
  END IF;

  -- 3. Attendance Records
  -- 2026-04-28: on_time (normal)
  IF NOT EXISTS (SELECT 1 FROM tr_attendances WHERE employee_id = v_karyawan_emp_id AND attendance_date = '2026-04-28') THEN
    INSERT INTO tr_attendances (id, employee_id, location_id, attendance_date, clock_in, clock_out, status, is_holiday, attendance_allowance)
    VALUES ('b6559551-dbca-4d6b-804d-8162b871e8ec', v_karyawan_emp_id, v_location_id, '2026-04-28', '2026-04-28 08:00:00+00', '2026-04-28 17:00:00+00', 'on_time', false, 25000);
  END IF;

  -- 2026-04-29: late (15 mins)
  IF NOT EXISTS (SELECT 1 FROM tr_attendances WHERE employee_id = v_karyawan_emp_id AND attendance_date = '2026-04-29') THEN
    INSERT INTO tr_attendances (id, employee_id, location_id, attendance_date, clock_in, clock_out, status, late_minutes, late_deduction, is_holiday, attendance_allowance)
    VALUES ('402ddfc1-7384-4dbb-9c14-f6b38b4ddb91', v_karyawan_emp_id, v_location_id, '2026-04-29', '2026-04-29 08:15:00+00', '2026-04-29 17:00:00+00', 'late', 15, 1250, false, 23750);
  END IF;

  -- 2026-04-30: early_leave (30 mins)
  IF NOT EXISTS (SELECT 1 FROM tr_attendances WHERE employee_id = v_karyawan_emp_id AND attendance_date = '2026-04-30') THEN
    INSERT INTO tr_attendances (id, employee_id, location_id, attendance_date, clock_in, clock_out, status, early_leave_minutes, is_holiday, attendance_allowance)
    VALUES ('674dd29a-7df7-48e0-afc4-727028310152', v_karyawan_emp_id, v_location_id, '2026-04-30', '2026-04-30 08:00:00+00', '2026-04-30 16:30:00+00', 'early_leave', 30, false, 22500);
  END IF;

  -- 2026-05-01: Holiday (Lebaran) - skipped, no holiday status in schema
  -- 2026-05-02: Absent
  IF NOT EXISTS (SELECT 1 FROM tr_attendances WHERE employee_id = v_karyawan_emp_id AND attendance_date = '2026-05-02') THEN
    INSERT INTO tr_attendances (id, employee_id, location_id, attendance_date, status, is_holiday, attendance_allowance)
    VALUES ('c11dd157-5236-4a0e-a64f-6c8f543db203', v_karyawan_emp_id, v_location_id, '2026-05-02', 'absent', false, 0);
  END IF;

  -- 4. Overtime Request (Pending)
  IF NOT EXISTS (SELECT 1 FROM tr_overtime_requests WHERE employee_id = v_karyawan_emp_id AND date = '2026-04-30') THEN
    INSERT INTO tr_overtime_requests (
      id, employee_id, requested_by, date, start_time, end_time, total_hours, 
      raw_minutes, day_type, description, rate_per_hour, total_overtime_pay, 
      total_meal_allowance, status
    ) VALUES (
      '7304fb27-cf4f-4dbb-91f9-7d297dd776cd', v_karyawan_emp_id, v_karyawan_emp_id, 
      '2026-04-30', '18:00:00', '20:00:00', 
      2.00, 120, 'workday', 'Lembur project deadline', 
      50000.00, 150000.00, 0, 'pending'
    );
  END IF;

  -- 5. Leave Request (Pending - Cuti Tahunan)
  IF NOT EXISTS (SELECT 1 FROM tr_leave_requests WHERE employee_id = v_karyawan_emp_id AND start_date = '2026-05-05') THEN
    INSERT INTO tr_leave_requests (
      id, employee_id, leave_type_id, start_date, end_date, total_days, 
      reason, status, supervisor_id
    ) VALUES (
      '8eaba6db-c764-4b85-ab27-4fc680a14b61', v_karyawan_emp_id, v_leave_type_id,
      '2026-05-05', '2026-05-07', 3, 'Liburan Lebaran', 'pending', v_spv_emp_id
    );
  END IF;

  -- 6. Reimbursement (Pending)
  IF NOT EXISTS (SELECT 1 FROM tr_reimbursements WHERE employee_id = v_karyawan_emp_id AND date = '2026-04-29') THEN
    INSERT INTO tr_reimbursements (
      id, employee_id, supervisor_id, date, category, amount, 
      description, status
    ) VALUES (
      '918d3ea6-6c5f-4278-9969-06686b194a36', v_karyawan_emp_id, v_spv_emp_id,
      '2026-04-29', 'transport', 50000, 'Taxi ke kantor', 'pending'
    );
  END IF;

  -- 7. Attendance Correction (Pending)
  IF NOT EXISTS (SELECT 1 FROM tr_attendance_corrections WHERE employee_id = v_karyawan_emp_id AND attendance_id = '402ddfc1-7384-4dbb-9c14-f6b38b4ddb91') THEN
    INSERT INTO tr_attendance_corrections (
      id, attendance_id, employee_id, submitted_by, 
      correction_type, correct_clock_in, reason, status, supervisor_id
    ) VALUES (
      'e21400f9-ee0d-4afb-88e7-2447d76562c5', '402ddfc1-7384-4dbb-9c14-f6b38b4ddb91',
      v_karyawan_emp_id, '3b6a63d3-04ee-49cd-bacd-4844d1b03100', 'forgot_clock_in',
      '08:00:00', 'Lupa clock in tepat waktu', 'pending', v_spv_emp_id
    );
  END IF;

  RAISE NOTICE 'Test data for karyawan created successfully!';
END $$;

-- ============================================================
-- SEED TEAMS DATA
-- ============================================================

DO $$
DECLARE
  v_company_id UUID := 'e135435b-cac1-4e79-af75-5c0f2bfdb8fd';
  v_it_dept_id UUID;
  v_team_prod_id UUID;
  v_team_opr_id UUID;
  v_karyawan_emp_id UUID := '3b6a63d3-04ee-49cd-bacd-4844d1b03101';
  v_spv_emp_id UUID := 'b216edb8-15e0-4c87-ac9b-fbb610ad0a49';
  v_karyawan2_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_karyawan2_emp_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567891';
  v_karyawan_role_id UUID;
  v_position_id UUID := '4bac3ff8-be44-4d39-8bdb-812049daebf1';
  v_location_id UUID := '76cd4d53-6ac5-45bb-a893-8f9e13eade29';
BEGIN
  -- Get karyawan role id
  SELECT id INTO v_karyawan_role_id FROM ms_roles WHERE name = 'karyawan';

  -- Create IT department if not exists
  IF NOT EXISTS (SELECT 1 FROM ms_departments WHERE code = 'IT') THEN
    INSERT INTO ms_departments (id, company_id, name, code)
    VALUES (gen_random_uuid(), v_company_id, 'IT Development', 'IT')
    RETURNING id INTO v_it_dept_id;
  ELSE
    SELECT id INTO v_it_dept_id FROM ms_departments WHERE code = 'IT';
  END IF;

  -- Create teams
  IF NOT EXISTS (SELECT 1 FROM ms_teams WHERE name = 'IT Production') THEN
    INSERT INTO ms_teams (id, department_id, name, code)
    VALUES (gen_random_uuid(), v_it_dept_id, 'IT Production', 'IT-PROD')
    RETURNING id INTO v_team_prod_id;
  ELSE
    SELECT id INTO v_team_prod_id FROM ms_teams WHERE name = 'IT Production';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM ms_teams WHERE name = 'IT Operasional') THEN
    INSERT INTO ms_teams (id, department_id, name, code)
    VALUES (gen_random_uuid(), v_it_dept_id, 'IT Operasional', 'IT-OPR');
  END IF;

  -- Assign existing karyawan and spv to IT Production team
  UPDATE tr_employees SET team_id = v_team_prod_id WHERE id = v_karyawan_emp_id;
  UPDATE tr_employees SET team_id = v_team_prod_id WHERE id = v_spv_emp_id;

  -- Create karyawan2 (teammate for work handover option)
  IF NOT EXISTS (SELECT 1 FROM tr_users WHERE email = 'karyawan2@samugara.co.id') THEN
    INSERT INTO tr_users (id, role_id, company_id, employee_id, email, password_hash, full_name, phone, is_active)
    VALUES (
      v_karyawan2_user_id,
      v_karyawan_role_id,
      v_company_id,
      'EMP_KAR2',
      'karyawan2@samugara.co.id',
      '$2b$10$6/0nbNueF6pcr63/SkXrgOKjFm1ioqlWt6avxpfa5DQhZthcSkzUO',
      'Karyawan 2 Test',
      '081234567007',
      true
    );

    INSERT INTO tr_employees (id, user_id, department_id, position_id, location_id, team_id, nik, full_name, gender, employment_status, join_date, is_active)
    VALUES (
      v_karyawan2_emp_id,
      v_karyawan2_user_id,
      v_it_dept_id,
      v_position_id,
      v_location_id,
      v_team_prod_id,
      'EMP_KAR2',
      'Karyawan 2 Test',
      'female',
      'permanen',
      '2024-01-01',
      true
    );
  END IF;

  RAISE NOTICE 'Teams seeded successfully!';
END $$;

-- Verify created data
SELECT 
  'Users' as data_type, COUNT(*) as count 
FROM tr_users 
WHERE email LIKE '%@samugara.co.id'
UNION ALL
SELECT 'Attendance', COUNT(*) 
FROM tr_attendances 
WHERE employee_id = '3b6a63d3-04ee-49cd-bacd-4844d1b03101'
UNION ALL
SELECT 'Overtime', COUNT(*) 
FROM tr_overtime_requests 
WHERE employee_id = '3b6a63d3-04ee-49cd-bacd-4844d1b03101'
UNION ALL
SELECT 'Leave', COUNT(*) 
FROM tr_leave_requests 
WHERE employee_id = '3b6a63d3-04ee-49cd-bacd-4844d1b03101'
UNION ALL
SELECT 'Reimbursement', COUNT(*) 
FROM tr_reimbursements 
WHERE employee_id = '3b6a63d3-04ee-49cd-bacd-4844d1b03101'
UNION ALL
SELECT 'Correction', COUNT(*) 
FROM tr_attendance_corrections 
WHERE employee_id = '3b6a63d3-04ee-49cd-bacd-4844d1b03101';
