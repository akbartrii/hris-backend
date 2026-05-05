import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListEmployeeDto } from './dto/list-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  private isAdminOrHRD(role: string): boolean {
    return ['manager_hrga', 'hrd', 'admin', 'super_admin'].includes(role);
  }

  async createEmployee(
    userId: string,
    userRole: string,
    dto: CreateEmployeeDto,
  ) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only HR/Admin can create employees');
    }

    let user_id: string | null = null;

    if (dto.email && dto.password) {
      const existingUser = await this.prisma.tr_users.findUnique({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      let role_id = dto.role_id;
      if (!role_id) {
        const karyawanRole = await this.prisma.ms_roles.findFirst({
          where: { name: 'karyawan' },
        });
        role_id = karyawanRole?.id;
      }

      if (!role_id) {
        throw new BadRequestException('Default role not found');
      }

      let company_id = dto.company_id;
      if (!company_id) {
        const adminUser = await this.prisma.tr_users.findUnique({
          where: { id: userId },
        });
        company_id = adminUser?.company_id;
      }

      if (!company_id) {
        throw new BadRequestException('Company ID is required');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const newUser = await this.prisma.tr_users.create({
        data: {
          email: dto.email,
          password_hash: hashedPassword,
          full_name: dto.full_name,
          phone: dto.phone || null,
          role_id,
          company_id,
        },
      });

      user_id = newUser.id;
    }

    const employeeData: any = {
      full_name: dto.full_name,
    };

    if (user_id) employeeData.user_id = user_id;
    if (dto.nik !== undefined) employeeData.nik = dto.nik;
    if (dto.gender !== undefined) employeeData.gender = dto.gender;
    if (dto.birth_date !== undefined)
      employeeData.birth_date = new Date(dto.birth_date);
    if (dto.department_id !== undefined)
      employeeData.department_id = dto.department_id;
    if (dto.position_id !== undefined)
      employeeData.position_id = dto.position_id;
    if (dto.location_id !== undefined)
      employeeData.location_id = dto.location_id;
    if (dto.supervisor_id !== undefined)
      employeeData.supervisor_id = dto.supervisor_id;
    if (dto.manager_id !== undefined) employeeData.manager_id = dto.manager_id;
    if (dto.team_id !== undefined) employeeData.team_id = dto.team_id;
    if (dto.employment_status !== undefined)
      employeeData.employment_status = dto.employment_status;
    if (dto.join_date !== undefined)
      employeeData.join_date = new Date(dto.join_date);
    if (dto.contract_end_date !== undefined)
      employeeData.contract_end_date = new Date(dto.contract_end_date);
    if (dto.base_salary !== undefined)
      employeeData.base_salary = dto.base_salary;
    if (dto.fixed_allowance !== undefined)
      employeeData.fixed_allowance = dto.fixed_allowance;
    if (dto.phone_allowance !== undefined)
      employeeData.phone_allowance = dto.phone_allowance;
    if (dto.dinas_allowance !== undefined)
      employeeData.dinas_allowance = dto.dinas_allowance;
    if (dto.shift_type !== undefined) employeeData.shift_type = dto.shift_type;
    if (dto.is_security !== undefined)
      employeeData.is_security = dto.is_security;
    if (dto.phone !== undefined) employeeData.phone = dto.phone;
    if (dto.address !== undefined) employeeData.address = dto.address;

    const employee = await this.prisma.tr_employees.create({
      data: employeeData,
    });

    return employee;
  }

  async listEmployees(
    userId: string,
    userRole: string,
    query: ListEmployeeDto,
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.department_id) {
      where.department_id = query.department_id;
    }

    if (query.position_id) {
      where.position_id = query.position_id;
    }

    if (query.team_id) {
      where.team_id = query.team_id;
    }

    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search, mode: 'insensitive' } },
        { nik: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tr_employees.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          ms_departments_tr_employees_department_idToms_departments: {
            select: { id: true, name: true },
          },
          ms_positions: { select: { id: true, name: true } },
          ms_locations: { select: { id: true, name: true } },
        },
      }),
      this.prisma.tr_employees.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async getEmployeeDetail(
    userId: string,
    userRole: string,
    employeeId: string,
  ) {
    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: employeeId },
      include: {
        ms_departments_tr_employees_department_idToms_departments: {
          select: { id: true, name: true },
        },
        ms_positions: { select: { id: true, name: true } },
        ms_locations: { select: { id: true, name: true } },
        tr_users: { select: { id: true, email: true, is_active: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (!this.isAdminOrHRD(userRole)) {
      const requester = await this.prisma.tr_employees.findUnique({
        where: { user_id: userId },
      });
      if (!requester || requester.id !== employeeId) {
        throw new ForbiddenException('You can only view your own profile');
      }
    }

    return employee;
  }

  async updateEmployee(
    userId: string,
    userRole: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only HR/Admin can update employee data');
    }

    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const updateData: any = {};

    if (dto.full_name !== undefined) updateData.full_name = dto.full_name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.birth_date !== undefined)
      updateData.birth_date = new Date(dto.birth_date);
    if (dto.department_id !== undefined)
      updateData.department_id = dto.department_id;
    if (dto.position_id !== undefined) updateData.position_id = dto.position_id;
    if (dto.location_id !== undefined) updateData.location_id = dto.location_id;
    if (dto.supervisor_id !== undefined)
      updateData.supervisor_id = dto.supervisor_id;
    if (dto.manager_id !== undefined) updateData.manager_id = dto.manager_id;
    if (dto.team_id !== undefined) updateData.team_id = dto.team_id;
    if (dto.employment_status !== undefined)
      updateData.employment_status = dto.employment_status;
    if (dto.join_date !== undefined)
      updateData.join_date = new Date(dto.join_date);
    if (dto.contract_end_date !== undefined)
      updateData.contract_end_date = new Date(dto.contract_end_date);
    if (dto.base_salary !== undefined) updateData.base_salary = dto.base_salary;
    if (dto.fixed_allowance !== undefined)
      updateData.fixed_allowance = dto.fixed_allowance;
    if (dto.phone_allowance !== undefined)
      updateData.phone_allowance = dto.phone_allowance;
    if (dto.dinas_allowance !== undefined)
      updateData.dinas_allowance = dto.dinas_allowance;
    if (dto.shift_type !== undefined) updateData.shift_type = dto.shift_type;
    if (dto.is_security !== undefined) updateData.is_security = dto.is_security;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const updated = await this.prisma.tr_employees.update({
      where: { id: employeeId },
      data: updateData,
    });

    return updated;
  }

  async getEmployeeSchedules(
    userId: string,
    userRole: string,
    employeeId: string,
  ) {
    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (!this.isAdminOrHRD(userRole)) {
      const requester = await this.prisma.tr_employees.findUnique({
        where: { user_id: userId },
      });
      if (!requester || requester.id !== employeeId) {
        throw new ForbiddenException('You can only view your own schedules');
      }
    }

    const schedules = await this.prisma.tr_employee_schedules.findMany({
      where: { employee_id: employeeId },
      orderBy: { effective_date: 'desc' },
      include: {
        ms_work_schedules: true,
      },
    });

    return schedules;
  }

  async getTeamMates(userId: string) {
    const employee = await this.prisma.tr_employees.findUnique({
      where: { user_id: userId },
      select: { team_id: true },
    });

    if (!employee || !employee.team_id) {
      return [];
    }

    const teamMates = await this.prisma.tr_employees.findMany({
      where: {
        team_id: employee.team_id,
        NOT: { user_id: userId },
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        nik: true,
        ms_positions: { select: { id: true, name: true } },
      },
      orderBy: { full_name: 'asc' },
    });

    return teamMates;
  }

  async getSubordinates(userId: string) {
    console.log(`[getSubordinates] userId=${userId}`);

    const employee = await this.prisma.tr_employees.findUnique({
      where: { user_id: userId },
      select: { id: true, full_name: true },
    });

    console.log(`[getSubordinates] employee=`, employee);

    if (!employee) {
      console.log(`[getSubordinates] No employee found for userId=${userId}`);
      return [];
    }

    console.log(
      `[getSubordinates] Looking for subordinates with supervisor_id=${employee.id} OR manager_id=${employee.id}`,
    );

    const subordinates = await this.prisma.tr_employees.findMany({
      where: {
        OR: [{ supervisor_id: employee.id }, { manager_id: employee.id }],
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        nik: true,
        supervisor_id: true,
        manager_id: true,
        ms_positions: { select: { id: true, name: true } },
        ms_departments_tr_employees_department_idToms_departments: {
          select: { id: true, name: true },
        },
      },
      orderBy: { full_name: 'asc' },
    });

    console.log(
      `[getSubordinates] Found ${subordinates.length} subordinates:`,
      subordinates.map((s) => ({
        id: s.id,
        name: s.full_name,
        supervisor_id: s.supervisor_id,
        manager_id: s.manager_id,
      })),
    );

    return subordinates;
  }

  async assignLocation(
    userId: string,
    userRole: string,
    employeeId: string,
    locationId: string,
  ) {
    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (!this.isAdminOrHRD(userRole)) {
      const requester = await this.prisma.tr_employees.findUnique({
        where: { user_id: userId },
      });
      if (!requester || requester.id !== employee.supervisor_id) {
        throw new ForbiddenException(
          'You can only assign location to your direct subordinates',
        );
      }
    }

    if (locationId) {
      const location = await this.prisma.ms_locations.findUnique({
        where: { id: locationId },
      });
      if (!location) {
        throw new NotFoundException('Location not found');
      }
      if (!location.is_active) {
        throw new ForbiddenException('Cannot assign inactive location');
      }
    }

    const updated = await this.prisma.tr_employees.update({
      where: { id: employeeId },
      data: { location_id: locationId || null },
    });

    return updated;
  }
}
