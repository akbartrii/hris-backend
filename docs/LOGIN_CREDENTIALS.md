# HRIS Samugara - Login Credentials (Test Users)

> Generated: 2 Mei 2026
> Password for all accounts: `password123`

## Login by Role

| Role                    | Email                       | Password      |
| ----------------------- | --------------------------- | ------------- |
| **Karyawan**            | `karyawan@samugara.co.id`   | `password123` |
| **Supervisor (Atasan)** | `spv@samugara.co.id`        | `password123` |
| **Supervisor 2 (Atasan)** | `spv2@samugara.co.id`    | `password123` |
| **Supervisor 3 (Atasan)** | `spv3@samugara.co.id`    | `password123` |
| **Manager HRGA**        | `hrga@samugara.co.id`       | `password123` |
| **HRD**                 | `hrd@samugara.co.id`        | `password123` |
| **Admin**               | `admin-role@samugara.co.id` | `password123` |
| **Super Admin**         | `superadmin@samugara.co.id` | `password123` |

## Existing Users (Already in DB)

| Email                         | Role           | Status   |
| ----------------------------- | -------------- | -------- |
| `admin@samugara.co.id`        | `super_admin`  | Existing |
| `rudi.hartono@samugara.co.id` | `manager_hrga` | Existing |
| `ahmad.spv@samugara.co.id`    | `atasan`       | Existing |
| `budi.santoso@samugara.co.id` | `karyawan`     | Existing |

## How to Run

1. Open Supabase SQL Editor
2. Run file: `docs/seed-users-all-roles.sql`
3. Verify with query:
   ```sql
   SELECT u.email, u.full_name, r.name as role_name
   FROM tr_users u
   JOIN ms_roles r ON u.role_id = r.id
   WHERE u.email LIKE '%@samugara.co.id'
   ORDER BY r.name;
   ```

## Test Data for karyawan@samugara.co.id

User `karyawan@samugara.co.id` sudah dilengkapi dengan data test:

| Data              | Jumlah    | Detail                                               |
| ----------------- | --------- | ---------------------------------------------------- |
| **Attendance**    | 5 records | Present (normal, late, early leave), Holiday, Absent |
| **Overtime**      | 1 request | Pending, 18:00-20:00, 2 jam                          |
| **Leave**         | 1 request | Pending, Cuti Tahunan, 3 hari (5-7 Mei)              |
| **Reimbursement** | 1 request | Pending, Transport Rp 50.000                         |
| **Correction**    | 1 request | Pending, clock_in 29 Apr                             |
| **Leave Balance** | 1 record  | Cuti Tahunan 2026: 12 hari, belum dipakai            |
| **Supervisor**    | Assigned  | spv@samugara.co.id                                   |

## Supervisor Mapping

| Karyawan              | Supervisor            |
| --------------------- | --------------------- |
| karyawan@samugara.co.id | spv@samugara.co.id  |
| karyawan2@samugara.co.id | spv@samugara.co.id |
| karyawan3@samugara.co.id | spv@samugara.co.id |
| karyawan4@samugara.co.id | spv@samugara.co.id |
| karyawan5@samugara.co.id | spv2@samugara.co.id |
| karyawan6@samugara.co.id | spv3@samugara.co.id |
| karyawan7@samugara.co.id | spv@samugara.co.id  |

## Notes

- All new users have associated `tr_employees` records
- Department: HRGA (default)
- Position: System Admin (default)
- Location: Default company location
- Status: Active (`is_active = true`)
- Password hashed with bcrypt (10 rounds)
- Karyawan supervisor: `spv@samugara.co.id`
