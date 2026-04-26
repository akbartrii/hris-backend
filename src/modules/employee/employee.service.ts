import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListEmployeeDto } from './dto/list-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  private isAdminOrHRD(role: string): boolean {
    return ['hrd', 'admin', 'super_admin'].includes(role);
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

    // If not admin/HRD, can only view own profile
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

    // Permission check
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
}
