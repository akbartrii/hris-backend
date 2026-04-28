import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOvernightDto } from './dto/create-overnight.dto';
import { ListOvernightDto } from './dto/list-overnight.dto';
import { ApproveOvernightDto } from './dto/approve-overnight.dto';

@Injectable()
export class OvernightService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, userRole: string, query: ListOvernightDto) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const where: any = {};
    const isAdmin = ['hrd', 'admin', 'super_admin'].includes(userRole);

    if (!isAdmin) {
      where.employee_id = user.tr_employees.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.tr_overnight_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(userId: string, dto: CreateOvernightDto) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.tr_overnight_requests.create({
      data: {
        employee_id: user.tr_employees.id,
        date: new Date(dto.date),
        shift_type: dto.shift_type,
        remarks: dto.remarks || null,
        status: 'pending',
        supervisor_id: user.tr_employees.supervisor_id,
      },
    });
  }

  async approve(
    userId: string,
    userRole: string,
    requestId: string,
    dto: ApproveOvernightDto,
  ) {
    const approver = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!approver || !approver.tr_employees) {
      throw new NotFoundException('Approver not found');
    }

    const request = await this.prisma.tr_overnight_requests.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Overnight request not found');
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
      return this.prisma.tr_overnight_requests.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          supervisor_approved_at: new Date(),
        },
      });
    } else {
      return this.prisma.tr_overnight_requests.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          rejection_reason: dto.rejection_reason || 'Rejected by supervisor',
        },
      });
    }
  }
}
