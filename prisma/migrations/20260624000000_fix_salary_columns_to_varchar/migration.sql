-- Fix column types: base_salary, fixed_allowance, phone_allowance, dinas_allowance
-- dari numeric ke VARCHAR(255) karena data salary dienkripsi menjadi string

-- Drop numeric check constraints
ALTER TABLE ms_employees DROP CONSTRAINT IF EXISTS ms_employees_base_salary_check;
ALTER TABLE ms_employees DROP CONSTRAINT IF EXISTS ms_employees_fixed_allowance_check;
ALTER TABLE ms_employees DROP CONSTRAINT IF EXISTS ms_employees_phone_allowance_check;
ALTER TABLE ms_employees DROP CONSTRAINT IF EXISTS ms_employees_dinas_allowance_check;

-- Drop view yang tergantung pada kolom ini
DROP VIEW IF EXISTS vw_employee_summary;

-- Alter column types
ALTER TABLE ms_employees ALTER COLUMN base_salary TYPE VARCHAR(255) USING base_salary::VARCHAR;
ALTER TABLE ms_employees ALTER COLUMN fixed_allowance TYPE VARCHAR(255) USING fixed_allowance::VARCHAR;
ALTER TABLE ms_employees ALTER COLUMN phone_allowance TYPE VARCHAR(255) USING phone_allowance::VARCHAR;
ALTER TABLE ms_employees ALTER COLUMN dinas_allowance TYPE VARCHAR(255) USING dinas_allowance::VARCHAR;

-- Recreate view
CREATE VIEW vw_employee_summary AS
 SELECT e.id AS employee_id,
    e.nik,
    e.full_name,
    e.gender,
    e.birth_date,
    e.address,
    e.employment_status,
    e.join_date,
    e.contract_end_date,
    e.resignation_date,
    e.base_salary,
    e.fixed_allowance,
    e.phone_allowance,
    e.dinas_allowance,
    e.bpjs_payment_type,
    e.shift_type,
    e.is_security,
    e.is_active,
    u.id AS user_id,
    u.email,
    u.phone AS user_phone,
    u.avatar_url,
    u.last_login_at,
    r.name AS role_name,
    r.display_name AS role_display_name,
    d.name AS department_name,
    d.code AS department_code,
    p.name AS position_name,
    p.level AS position_level,
    l.name AS location_name,
    l.type AS location_type,
    s.full_name AS supervisor_name,
    m.full_name AS manager_name,
        CASE
            WHEN e.resignation_date IS NOT NULL THEN 'resigned'::text
            WHEN e.is_active = true THEN 'active'::text
            ELSE 'inactive'::text
        END AS employment_state
   FROM ms_employees e
     LEFT JOIN ms_users u ON e.user_id = u.id
     LEFT JOIN ms_roles r ON u.role_id = r.id
     LEFT JOIN ms_departments d ON e.department_id = d.id
     LEFT JOIN ms_positions p ON e.position_id = p.id
     LEFT JOIN ms_locations l ON e.location_id = l.id
     LEFT JOIN ms_employees s ON e.supervisor_id = s.id
     LEFT JOIN ms_employees m ON e.manager_id = m.id;
