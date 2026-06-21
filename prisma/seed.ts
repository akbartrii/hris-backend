import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existingCompany = await prisma.ms_companies.findFirst();
  const isAlreadySeeded = !!existingCompany;

  // ======================== MASTER DATA (first run only) ========================

  let company = existingCompany;
  let roles: Record<string, { id: string }> = {};
  let department: { id: string } | undefined;
  let itDepartment: { id: string } | undefined;
  let position: { id: string } | undefined;
  let location: { id: string } | undefined;
  let schedule: { id: string } | undefined;
  let annualLeave: { id: string } | undefined;
  let team: { id: string } | undefined;

  if (!isAlreadySeeded) {
    company = await prisma.ms_companies.create({
      data: { name: 'PT Samugara', code: 'SAM', address: 'Jl. Contoh No. 123, Jakarta Pusat', phone: '021-1234567', email: 'info@samugara.co.id', is_active: true },
    });
    console.log('Company created:', company.name);

    const roleNames = ['karyawan', 'atasan', 'manager_hrga', 'hrd', 'admin', 'super_admin'] as const;
    const roleDisplay: Record<string, string> = {
      karyawan: 'Karyawan', atasan: 'Atasan / Supervisor', manager_hrga: 'Manager HRGA',
      hrd: 'HRD', admin: 'Admin', super_admin: 'Super Admin',
    };
    for (const name of roleNames) {
      roles[name] = await prisma.ms_roles.create({ data: { name, display_name: roleDisplay[name], permissions: [] } });
    }
    console.log('Roles created:', Object.keys(roles).join(', '));

    department = await prisma.ms_departments.create({ data: { company_id: company.id, name: 'Human Resources & General Affairs', code: 'HRGA' } });
    itDepartment = await prisma.ms_departments.create({ data: { company_id: company.id, name: 'IT Development', code: 'IT' } });
    position = await prisma.ms_positions.create({ data: { department_id: department.id, name: 'Staff', level: 'Staff' } });
    location = await prisma.ms_locations.create({ data: { company_id: company.id, name: 'Kantor Pusat', type: 'office', latitude: -6.2088, longitude: 106.8456, radius_meters: 100, address: 'Jl. Contoh No. 123, Jakarta Pusat', is_active: true } });
    schedule = await prisma.ms_work_schedules.create({ data: { name: 'Regular (Senin-Jumat 08:00-17:00)', shift_code: 'REG-1', schedule_type: 'regular', start_time: new Date('1970-01-01T08:00:00Z'), end_time: new Date('1970-01-01T17:00:00Z'), break_start: new Date('1970-01-01T12:00:00Z'), break_end: new Date('1970-01-01T13:00:00Z'), work_days: [1, 2, 3, 4, 5], is_holiday_off: true } });
    annualLeave = await prisma.ms_leave_types.create({ data: { name: 'Cuti Tahunan', code: 'ANNUAL', default_days: 12, is_annual: true, is_paid: true, max_days_per_request: 12 } });
    await prisma.ms_leave_types.create({ data: { name: 'Cuti Sakit', code: 'SICK', default_days: 14, is_annual: true, is_paid: true, requires_attachment: true, max_days_per_request: 14 } });
    await prisma.ms_time_off_types.create({ data: { name: 'Izin', code: 'IZIN', affects_salary: true } });
    await prisma.ms_time_off_types.create({ data: { name: 'Izin Sakit', code: 'IZIN_SAKIT', requires_attachment: true } });
    team = await prisma.ms_teams.create({ data: { department_id: itDepartment.id, name: 'IT Production', code: 'IT-PROD', is_active: true } });
    console.log('Master data created');
  } else {
    company = existingCompany;
    const allRoles = await prisma.ms_roles.findMany();
    for (const r of allRoles) roles[r.name] = r;
    department = await prisma.ms_departments.findFirst({ where: { code: 'HRGA' } }) || undefined;
    itDepartment = await prisma.ms_departments.findFirst({ where: { code: 'IT' } }) || undefined;
    position = await prisma.ms_positions.findFirst() || undefined;
    location = await prisma.ms_locations.findFirst() || undefined;
    schedule = await prisma.ms_work_schedules.findFirst() || undefined;
    annualLeave = await prisma.ms_leave_types.findFirst({ where: { code: 'ANNUAL' } }) || undefined;
    team = await prisma.ms_teams.findFirst() || undefined;
  }

  // ======================== USERS & EMPLOYEES ========================

  const passwordHash = await bcrypt.hash('password123', 10);

  type UserSeed = {
    email: string;
    full_name: string;
    phone: string;
    role_name: string;
    nik: string;
    gender: string;
    join_date: Date;
    supervisor_nik?: string;
  };

  const usersData: UserSeed[] = [
    { email: 'superadmin@samugara.co.id', full_name: 'Super Admin Test', phone: '081234567006', role_name: 'super_admin', nik: 'EMP_SA', gender: 'male', join_date: new Date('2022-01-01') },
    { email: 'admin-role@samugara.co.id', full_name: 'Admin Test', phone: '081234567005', role_name: 'admin', nik: 'EMP_ADMIN', gender: 'male', join_date: new Date('2022-01-01') },
    { email: 'hrd@samugara.co.id', full_name: 'HRD Test', phone: '081234567004', role_name: 'hrd', nik: 'EMP_HRD', gender: 'male', join_date: new Date('2022-01-01') },
    { email: 'hrga@samugara.co.id', full_name: 'Manager HRGA Test', phone: '081234567003', role_name: 'manager_hrga', nik: 'EMP_HRGA', gender: 'male', join_date: new Date('2022-01-01') },
    { email: 'spv@samugara.co.id', full_name: 'Supervisor Test', phone: '081234567002', role_name: 'atasan', nik: 'EMP_SPV', gender: 'male', join_date: new Date('2023-01-01') },
    { email: 'karyawan@samugara.co.id', full_name: 'Karyawan Test', phone: '081234567001', role_name: 'karyawan', nik: 'EMP_KAR', gender: 'male', join_date: new Date('2024-01-01'), supervisor_nik: 'EMP_SPV' },
    { email: 'karyawan2@samugara.co.id', full_name: 'Karyawan 2 Test', phone: '081234567007', role_name: 'karyawan', nik: 'EMP_KAR2', gender: 'female', join_date: new Date('2024-06-01'), supervisor_nik: 'EMP_SPV' },
    // Additional karyawan users
    { email: 'karyawan3@samugara.co.id', full_name: 'Budi Santoso', phone: '081234567008', role_name: 'karyawan', nik: 'EMP_KAR3', gender: 'male', join_date: new Date('2024-03-01'), supervisor_nik: 'EMP_SPV' },
    { email: 'karyawan4@samugara.co.id', full_name: 'Siti Rahmawati', phone: '081234567009', role_name: 'karyawan', nik: 'EMP_KAR4', gender: 'female', join_date: new Date('2024-07-01'), supervisor_nik: 'EMP_SPV' },
    { email: 'karyawan5@samugara.co.id', full_name: 'Ahmad Hidayat', phone: '081234567010', role_name: 'karyawan', nik: 'EMP_KAR5', gender: 'male', join_date: new Date('2025-01-01'), supervisor_nik: 'EMP_KAR' },
    { email: 'karyawan6@samugara.co.id', full_name: 'Dewi Lestari', phone: '081234567011', role_name: 'karyawan', nik: 'EMP_KAR6', gender: 'female', join_date: new Date('2024-11-01'), supervisor_nik: 'EMP_HRGA' },
    { email: 'karyawan7@samugara.co.id', full_name: 'Rudi Hermawan', phone: '081234567012', role_name: 'karyawan', nik: 'EMP_KAR7', gender: 'male', join_date: new Date('2025-02-01'), supervisor_nik: 'EMP_HRD' },
  ];

  const userRecords: Record<string, { id: string; employeeId: string }> = {};

  for (const u of usersData) {
    const existingUser = await prisma.ms_users.findUnique({ where: { email: u.email } });
    if (existingUser) {
      const emp = await prisma.ms_employees.findFirst({ where: { user_id: existingUser.id } });
      userRecords[u.nik] = { id: existingUser.id, employeeId: emp?.id || '' };
      continue;
    }

    const user = await prisma.ms_users.create({
      data: {
        role_id: roles[u.role_name]!.id,
        company_id: company!.id,
        employee_id: u.nik,
        email: u.email,
        password_hash: passwordHash,
        full_name: u.full_name,
        phone: u.phone,
        is_active: true,
      },
    });

    const employee = await prisma.ms_employees.create({
      data: {
        user_id: user.id,
        department_id: u.role_name === 'karyawan' || u.role_name === 'atasan' ? itDepartment!.id : department!.id,
        position_id: position!.id,
        location_id: location!.id,
        nik: u.nik,
        full_name: u.full_name,
        gender: u.gender,
        employment_status: 'permanen',
        join_date: u.join_date,
        is_active: true,
      },
    });

    userRecords[u.nik] = { id: user.id, employeeId: employee.id };
  }

  console.log('Users & Employees:', Object.keys(userRecords).join(', '));

  // ======================== RELATIONSHIPS ========================

  for (const u of usersData) {
    if (u.supervisor_nik && userRecords[u.nik]?.employeeId && userRecords[u.supervisor_nik]?.employeeId) {
      const emp = await prisma.ms_employees.findUnique({ where: { id: userRecords[u.nik].employeeId } });
      if (emp && !emp.supervisor_id) {
        await prisma.ms_employees.update({
          where: { id: userRecords[u.nik].employeeId },
          data: { supervisor_id: userRecords[u.supervisor_nik].employeeId },
        });
      }
    }
  }

  // Set team & department heads
  if (!isAlreadySeeded) {
    const spvEmpId = userRecords['EMP_SPV'].employeeId;
    const karEmpId = userRecords['EMP_KAR'].employeeId;
    const kar2EmpId = userRecords['EMP_KAR2'].employeeId;
    const hrgaEmpId = userRecords['EMP_HRGA'].employeeId;

    await prisma.ms_employees.update({ where: { id: spvEmpId }, data: { team_id: team!.id } });
    await prisma.ms_employees.update({ where: { id: karEmpId }, data: { team_id: team!.id } });
    await prisma.ms_employees.update({ where: { id: kar2EmpId }, data: { team_id: team!.id } });
    await prisma.ms_departments.update({ where: { id: department!.id }, data: { head_employee_id: hrgaEmpId } });
    await prisma.ms_departments.update({ where: { id: itDepartment!.id }, data: { head_employee_id: spvEmpId } });
  }

  // ======================== TRANSACTION DATA (first run only) ========================

  if (!isAlreadySeeded) {
    const spvEmpId = userRecords['EMP_SPV'].employeeId;
    const karEmpId = userRecords['EMP_KAR'].employeeId;

    await prisma.tr_leave_balances.create({
      data: { employee_id: karEmpId, leave_type_id: annualLeave!.id, year: 2026, total_days: 12, used_days: 0, remaining_days: 12 },
    });

    const today = new Date();
    const makeDate = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    for (let i = -5; i <= -1; i++) {
      const date = makeDate(i);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const clockIn = new Date(date); clockIn.setHours(8, 0, 0, 0);
      const clockOut = new Date(date); clockOut.setHours(17, 0, 0, 0);
      const isLate = i === -3;
      if (isLate) clockIn.setHours(8, 15, 0, 0);
      await prisma.tr_attendances.create({
        data: {
          employee_id: karEmpId, location_id: location!.id, attendance_date: date,
          clock_in: clockIn, clock_out: clockOut, status: isLate ? 'late' : 'on_time',
          late_minutes: isLate ? 15 : 0, late_deduction: isLate ? 1250 : 0,
          attendance_allowance: isLate ? 23750 : 25000, is_holiday: false,
        },
      });
    }

    await prisma.tr_attendances.create({
      data: { employee_id: karEmpId, location_id: location!.id, attendance_date: makeDate(0), clock_in: new Date(), status: 'on_time', attendance_allowance: 25000, is_holiday: false },
    });

    const otDate = makeDate(-2);
    await prisma.tr_overtime_requests.create({
      data: { employee_id: karEmpId, requested_by: karEmpId, date: otDate, start_time: new Date('1970-01-01T18:00:00Z'), end_time: new Date('1970-01-01T20:00:00Z'), total_hours: 2, raw_minutes: 120, day_type: 'workday', description: 'Lembur project deadline', rate_per_hour: 50000, total_overtime_pay: 150000, total_meal_allowance: 0, status: 'pending', manager_id: spvEmpId },
    });

    const leaveStart = makeDate(7);
    const leaveEnd = makeDate(9);
    await prisma.tr_leave_requests.create({
      data: { employee_id: karEmpId, leave_type_id: annualLeave!.id, start_date: leaveStart, end_date: leaveEnd, total_days: 3, reason: 'Liburan keluarga', status: 'pending', supervisor_id: spvEmpId },
    });

    await prisma.tr_reimbursements.create({
      data: { employee_id: karEmpId, date: makeDate(-4), category: 'transport', amount: 50000, description: 'Transportasi meeting klien', status: 'pending', supervisor_id: spvEmpId },
    });

    const lateAttendance = await prisma.tr_attendances.findFirst({
      where: { employee_id: karEmpId, status: 'late' }, orderBy: { attendance_date: 'desc' },
    });
    if (lateAttendance) {
      await prisma.tr_attendance_corrections.create({
        data: { attendance_id: lateAttendance.id, employee_id: karEmpId, submitted_by: userRecords['EMP_KAR'].id, correction_type: 'forgot_clock_in', correct_clock_in: new Date('1970-01-01T08:00:00Z'), reason: 'Lupa clock in, padahal sudah datang tepat waktu', status: 'pending', supervisor_id: spvEmpId },
      });
    }

    await prisma.tr_employee_schedules.create({
      data: { employee_id: karEmpId, schedule_id: schedule!.id, effective_date: new Date('2026-01-01') },
    });

    await prisma.ms_overtime_meal_allowances.create({
      data: { day_type: 'workday', time_start: new Date('1970-01-01T18:00:00Z'), time_end: new Date('1970-01-01T22:00:00Z'), amount: 25000 },
    });

    console.log('Transaction data created');
  }

  // ======================== VERIFICATION ========================

  const counts = {
    users: await prisma.ms_users.count(),
    employees: await prisma.ms_employees.count(),
    attendances: await prisma.tr_attendances.count(),
    leaveRequests: await prisma.tr_leave_requests.count(),
    overtimeRequests: await prisma.tr_overtime_requests.count(),
    reimbursements: await prisma.tr_reimbursements.count(),
    corrections: await prisma.tr_attendance_corrections.count(),
  };
  console.log('Seed completed:', counts);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
