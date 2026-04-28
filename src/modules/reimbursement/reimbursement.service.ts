import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { ListReimbursementDto } from './dto/list-reimbursement.dto';
import { ApproveReimbursementDto } from './dto/approve-reimbursement.dto';

@Injectable()
export class ReimbursementService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, userRole: string, query: ListReimbursementDto) {
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
    if (query.category) {
      where.category = query.category;
    }

    return this.prisma.tr_reimbursements.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(userId: string, dto: CreateReimbursementDto) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.tr_reimbursements.create({
      data: {
        employee_id: user.tr_employees.id,
        supervisor_id: user.tr_employees.supervisor_id,
        date: new Date(dto.date),
        category: dto.category,
        amount: dto.amount,
        description: dto.description || null,
        proof_image_url: dto.proof_image_url || null,
        status: 'pending',
      },
    });
  }

  async approve(
    userId: string,
    userRole: string,
    reimbursementId: string,
    dto: ApproveReimbursementDto,
  ) {
    const approver = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!approver || !approver.tr_employees) {
      throw new NotFoundException('Approver not found');
    }

    const reimbursement = await this.prisma.tr_reimbursements.findUnique({
      where: { id: reimbursementId },
    });
    if (!reimbursement) {
      throw new NotFoundException('Reimbursement not found');
    }

    if (dto.action === 'reject') {
      return this.prisma.tr_reimbursements.update({
        where: { id: reimbursementId },
        data: {
          status: 'rejected',
          rejection_reason: dto.rejection_reason || 'Rejected',
        },
      });
    }

    if (dto.action !== 'approve') {
      throw new BadRequestException('Invalid action');
    }

    // Step 1: Supervisor approval
    if (
      reimbursement.status === 'pending' &&
      reimbursement.supervisor_id === approver.tr_employees.id
    ) {
      return this.prisma.tr_reimbursements.update({
        where: { id: reimbursementId },
        data: {
          status: 'supervisor_approved',
          supervisor_approved_at: new Date(),
        },
      });
    }

    // Step 2: HR final approval
    const isHR = ['hrd', 'admin', 'super_admin'].includes(userRole);
    if (reimbursement.status === 'supervisor_approved' && isHR) {
      return this.prisma.tr_reimbursements.update({
        where: { id: reimbursementId },
        data: {
          status: 'approved',
          hr_approved_by: approver.tr_employees.id,
          hr_approved_at: new Date(),
        },
      });
    }

    throw new ForbiddenException(
      'You are not authorized to approve this reimbursement at this stage',
    );
  }
}
