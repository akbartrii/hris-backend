import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ApproveLeaveDto } from './dto/approve-leave.dto';
import { ListLeaveDto } from './dto/list-leave.dto';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  private async getEmployeeFromUser(userId: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }
    return user.tr_employees;
  }

  private async getOrCreateLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
  ) {
    let balance = await this.prisma.tr_leave_balances.findUnique({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year,
        },
      },
    });

    if (!balance) {
      const leaveType = await this.prisma.ms_leave_types.findUnique({
        where: { id: leaveTypeId },
      });

      balance = await this.prisma.tr_leave_balances.create({
        data: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year,
          total_days: leaveType?.default_days || 0,
          used_days: 0,
        },
      });
    }

    return balance;
  }

  async createLeave(userId: string, dto: CreateLeaveDto) {
    const employee = await this.getEmployeeFromUser(userId);
    const leaveType = await this.prisma.ms_leave_types.findUnique({
      where: { id: dto.leave_type_id },
    });

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    // Check if annual leave and employee has worked for at least 1 year
    if (leaveType.is_annual) {
      if (!employee.join_date) {
        throw new BadRequestException('Join date not set');
      }
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (new Date(employee.join_date) > oneYearAgo) {
        throw new BadRequestException(
          'Annual leave only available after 1 year of service',
        );
      }
    }

    // Check leave balance
    const year = new Date(dto.start_date).getFullYear();
    const balance = await this.getOrCreateLeaveBalance(
      employee.id,
      dto.leave_type_id,
      year,
    );

    if (balance.remaining_days < dto.total_days) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${balance.remaining_days}, Requested: ${dto.total_days}`,
      );
    }

    const leave = await this.prisma.tr_leave_requests.create({
      data: {
        employee_id: employee.id,
        leave_type_id: dto.leave_type_id,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        total_days: dto.total_days,
        reason: dto.reason,
        attachment_url: dto.attachment_url,
        status: 'pending',
      },
    });

    return leave;
  }

  async getLeaveBalance(userId: string) {
    const employee = await this.getEmployeeFromUser(userId);
    const year = new Date().getFullYear();

    const balances = await this.prisma.tr_leave_balances.findMany({
      where: {
        employee_id: employee.id,
        year,
      },
      include: { ms_leave_types: true },
    });

    return balances;
  }

  async listLeaves(userId: string, query: ListLeaveDto) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true, ms_roles: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    const userRole = user.ms_roles?.name || 'karyawan';

    if (!['admin', 'hrd', 'manager_hrga', 'super_admin'].includes(userRole)) {
      where.employee_id = user.tr_employees.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.tr_leave_requests.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          ms_leave_types: true,
          tr_employees_tr_leave_requests_employee_idTotr_employees: true,
        },
      }),
      this.prisma.tr_leave_requests.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async approveLeave(
    userId: string,
    leaveId: string,
    dto: ApproveLeaveDto,
    approverRole: string,
  ) {
    const approver = await this.getEmployeeFromUser(userId);
    const leave = await this.prisma.tr_leave_requests.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status !== 'pending' && leave.status !== 'supervisor_approved') {
      throw new BadRequestException('Leave request already processed');
    }

    if (approverRole === 'atasan') {
      if (leave.status !== 'pending') {
        throw new BadRequestException('Leave request already processed');
      }

      if (dto.action === 'approve') {
        await this.prisma.tr_leave_requests.update({
          where: { id: leaveId },
          data: {
            supervisor_approved_at: new Date(),
            supervisor_id: approver.id,
            status: 'supervisor_approved',
          },
        });
      } else {
        await this.prisma.tr_leave_requests.update({
          where: { id: leaveId },
          data: {
            supervisor_id: approver.id,
            status: 'rejected',
            rejection_reason: dto.rejection_reason || 'Rejected by supervisor',
          },
        });
      }
      return { message: `Leave request ${dto.action}d by supervisor` };
    }

    if (
      approverRole === 'manager_hrga' ||
      approverRole === 'admin' ||
      approverRole === 'super_admin'
    ) {
      if (leave.status !== 'supervisor_approved') {
        throw new BadRequestException('Must be approved by supervisor first');
      }

      if (dto.action === 'approve') {
        // Deduct leave balance
        const year = new Date(leave.start_date).getFullYear();
        await this.prisma.tr_leave_balances.updateMany({
          where: {
            employee_id: leave.employee_id,
            leave_type_id: leave.leave_type_id,
            year,
          },
          data: {
            used_days: { increment: leave.total_days },
          },
        });

        await this.prisma.tr_leave_requests.update({
          where: { id: leaveId },
          data: {
            hrga_approved_at: new Date(),
            hrga_manager_id: approver.id,
            status: 'approved',
          },
        });
      } else {
        await this.prisma.tr_leave_requests.update({
          where: { id: leaveId },
          data: {
            hrga_manager_id: approver.id,
            status: 'rejected',
            rejection_reason: dto.rejection_reason || 'Rejected by HRGA',
          },
        });
      }
      return { message: `Leave request ${dto.action}d by HRGA` };
    }

    throw new BadRequestException('Insufficient permissions');
  }
}
