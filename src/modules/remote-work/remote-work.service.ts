import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRemoteWorkDto } from './dto/create-remote-work.dto';
import { ListRemoteWorkDto } from './dto/list-remote-work.dto';
import { ApproveRemoteWorkDto } from './dto/approve-remote-work.dto';

@Injectable()
export class RemoteWorkService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, userRole: string, query: ListRemoteWorkDto) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const where: any = {};
    const isAdmin = ['hrd', 'admin', 'super_admin'].includes(userRole);

    if (query.employee_id && isAdmin) {
      where.employee_id = query.employee_id;
    } else {
      where.employee_id = user.tr_employees.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.tr_remote_work_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(userId: string, dto: CreateRemoteWorkDto) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    const existing = await this.prisma.tr_remote_work_requests.findFirst({
      where: {
        employee_id: user.tr_employees.id,
        status: { in: ['pending', 'approved'] },
        OR: [{ start_date: { lte: end }, end_date: { gte: start } }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'You already have a pending or approved WFH request in this date range',
      );
    }

    return this.prisma.tr_remote_work_requests.create({
      data: {
        employee_id: user.tr_employees.id,
        start_date: start,
        end_date: end,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address || null,
        radius_meters: 50,
        reason: dto.reason || null,
        status: 'pending',
        supervisor_id: user.tr_employees.supervisor_id,
      },
    });
  }

  async approve(
    userId: string,
    userRole: string,
    requestId: string,
    dto: ApproveRemoteWorkDto,
  ) {
    const approver = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!approver || !approver.tr_employees) {
      throw new NotFoundException('Approver not found');
    }

    const request = await this.prisma.tr_remote_work_requests.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Remote work request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Request already processed');
    }

    const isSuperAdmin = userRole === 'super_admin';
    const isSupervisor = request.supervisor_id === approver.tr_employees.id;

    if (!isSuperAdmin && !isSupervisor) {
      throw new ForbiddenException(
        'Only supervisor or super admin can approve',
      );
    }

    if (dto.action === 'approve') {
      await this.prisma.tr_employees.update({
        where: { id: request.employee_id },
        data: { current_remote_work_id: requestId },
      });

      return this.prisma.tr_remote_work_requests.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          approved_at: new Date(),
        },
      });
    } else {
      await this.prisma.tr_employees.updateMany({
        where: {
          id: request.employee_id,
          current_remote_work_id: requestId,
        },
        data: { current_remote_work_id: null },
      });

      return this.prisma.tr_remote_work_requests.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          rejected_reason: dto.rejection_reason || 'Rejected by supervisor',
        },
      });
    }
  }
}
