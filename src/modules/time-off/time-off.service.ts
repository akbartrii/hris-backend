import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { ApproveTimeOffDto } from './dto/approve-time-off.dto';
import { ListTimeOffDto } from './dto/list-time-off.dto';

@Injectable()
export class TimeOffService {
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

  async createTimeOff(userId: string, dto: CreateTimeOffDto) {
    const employee = await this.getEmployeeFromUser(userId);

    const timeOffType = await this.prisma.ms_time_off_types.findUnique({
      where: { id: dto.time_off_type_id },
    });

    if (!timeOffType) {
      throw new NotFoundException('Time off type not found');
    }

    const timeOff = await this.prisma.tr_time_off_requests.create({
      data: {
        employee_id: employee.id,
        time_off_type_id: dto.time_off_type_id,
        date: new Date(dto.date),
        start_time: dto.start_time
          ? new Date(`1970-01-01T${dto.start_time}:00`)
          : null,
        end_time: dto.end_time
          ? new Date(`1970-01-01T${dto.end_time}:00`)
          : null,
        reason: dto.reason,
        attachment_url: dto.attachment_url,
        status: 'pending',
      },
    });

    return timeOff;
  }

  async listTimeOffs(userId: string, query: ListTimeOffDto) {
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
      this.prisma.tr_time_off_requests.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          ms_time_off_types: true,
          tr_employees_tr_time_off_requests_employee_idTotr_employees: true,
        },
      }),
      this.prisma.tr_time_off_requests.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async approveTimeOff(
    userId: string,
    timeOffId: string,
    dto: ApproveTimeOffDto,
    approverRole: string,
  ) {
    const approver = await this.getEmployeeFromUser(userId);
    const timeOff = await this.prisma.tr_time_off_requests.findUnique({
      where: { id: timeOffId },
    });

    if (!timeOff) {
      throw new NotFoundException('Time off request not found');
    }

    if (
      timeOff.status !== 'pending' &&
      timeOff.status !== 'supervisor_approved'
    ) {
      throw new BadRequestException('Time off request already processed');
    }

    if (approverRole === 'atasan') {
      if (timeOff.status !== 'pending') {
        throw new BadRequestException('Time off request already processed');
      }

      if (dto.action === 'approve') {
        await this.prisma.tr_time_off_requests.update({
          where: { id: timeOffId },
          data: {
            supervisor_approved_at: new Date(),
            supervisor_id: approver.id,
            status: 'supervisor_approved',
          },
        });
      } else {
        await this.prisma.tr_time_off_requests.update({
          where: { id: timeOffId },
          data: {
            supervisor_id: approver.id,
            status: 'rejected',
            rejection_reason: dto.rejection_reason || 'Rejected by supervisor',
          },
        });
      }
      return { message: `Time off request ${dto.action}d by supervisor` };
    }

    if (
      approverRole === 'manager_hrga' ||
      approverRole === 'admin' ||
      approverRole === 'super_admin'
    ) {
      if (timeOff.status !== 'supervisor_approved') {
        throw new BadRequestException('Must be approved by supervisor first');
      }

      if (dto.action === 'approve') {
        await this.prisma.tr_time_off_requests.update({
          where: { id: timeOffId },
          data: {
            hrga_approved_at: new Date(),
            hrga_manager_id: approver.id,
            status: 'approved',
          },
        });
      } else {
        await this.prisma.tr_time_off_requests.update({
          where: { id: timeOffId },
          data: {
            hrga_manager_id: approver.id,
            status: 'rejected',
            rejection_reason: dto.rejection_reason || 'Rejected by HRGA',
          },
        });
      }
      return { message: `Time off request ${dto.action}d by HRGA` };
    }

    throw new BadRequestException('Insufficient permissions');
  }
}
