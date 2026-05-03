-- Migration: Fix day_type constraints (DROP first, then UPDATE, then ADD)
-- Run this SQL directly in your PostgreSQL database

-- ============================================
-- 1. DROP constraints first so we can update freely
-- ============================================
ALTER TABLE tr_overtime_requests
DROP CONSTRAINT IF EXISTS tr_overtime_requests_day_type_check;

ALTER TABLE ms_overtime_meal_allowances
DROP CONSTRAINT IF EXISTS ms_overtime_meal_allowances_day_type_check;

-- ============================================
-- 2. UPDATE existing data to new general values
-- ============================================
UPDATE tr_overtime_requests
SET day_type = CASE day_type
  WHEN 'workday' THEN 'weekday'
  WHEN 'saturday' THEN 'weekend'
  WHEN 'sunday' THEN 'weekend'
  WHEN 'sunday_holiday' THEN 'holiday'
  ELSE day_type
END
WHERE day_type IN ('workday', 'saturday', 'sunday', 'sunday_holiday');

UPDATE ms_overtime_meal_allowances
SET day_type = CASE day_type
  WHEN 'workday' THEN 'weekday'
  WHEN 'saturday' THEN 'weekend'
  WHEN 'sunday_holiday' THEN 'holiday'
  ELSE day_type
END
WHERE day_type IN ('workday', 'saturday', 'sunday_holiday');

-- ============================================
-- 3. ADD new constraints
-- ============================================
ALTER TABLE tr_overtime_requests
ADD CONSTRAINT tr_overtime_requests_day_type_check
CHECK (day_type IN ('weekday', 'weekend', 'holiday'));

ALTER TABLE ms_overtime_meal_allowances
ADD CONSTRAINT ms_overtime_meal_allowances_day_type_check
CHECK (day_type IN ('weekday', 'weekend', 'holiday'));
