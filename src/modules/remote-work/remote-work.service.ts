import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateRemoteWorkDto } from './dto/create-remote-work.dto';
import { ListRemoteWorkDto } from './dto/list-remote-work.dto';
import { ApproveRemoteWorkDto } from './dto/approve-remote-work.dto';

@Injectable()
export class RemoteWorkService {
  private readonly logger = new Logger(RemoteWorkService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async list(userId: string, userRole: string, query: ListRemoteWorkDto) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const where: any = {};
    const isAdmin = ['manager_hrga', 'hrd', 'admin', 'super_admin'].includes(
      userRole,
    );

    if (query.employee_id && isAdmin) {
      where.employee_id = query.employee_id;
    } else {
      where.employee_id = user.tr_employees.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.tr_remote_work_requests.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tr_remote_work_requests.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { page, limit, total, totalPages } };
  }

  async listSubordinates(
    userId: string,
    userRole: string,
    query: ListRemoteWorkDto,
  ) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const allowedRoles = [
      'atasan',
      'manager_hrga',
      'hrd',
      'admin',
      'super_admin',
    ];
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException(
        'Only supervisor or super admin can view subordinate requests',
      );
    }

    const where: any = {};

    // Supervisor (atasan) can only see their direct subordinates
    // Admin/HR roles can see all requests
    if (userRole === 'atasan') {
      this.logger.log(
        `[listSubordinates] user_id=${userId}, employee_id=${user.tr_employees.id}, name=${user.tr_employees.full_name}`,
      );
      const subordinates = await this.prisma.tr_employees.findMany({
        where: { supervisor_id: user.tr_employees.id },
        select: { id: true, full_name: true },
      });
      const subordinateIds = subordinates.map((e) => e.id);
      this.logger.log(
        `[listSubordinates] Found ${subordinates.length} subordinates: ${subordinates.map((e) => `${e.full_name}(${e.id})`).join(', ')}`,
      );
      if (subordinateIds.length === 0) {
        return {
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
      }
      where.employee_id = { in: subordinateIds };
    }

    if (query.status) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    this.logger.log(`[listSubordinates] Query where: ${JSON.stringify(where)}`);

    const [data, total] = await Promise.all([
      this.prisma.tr_remote_work_requests.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          tr_employees_tr_remote_work_requests_employee_idTotr_employees: {
            select: {
              full_name: true,
              tr_users: {
                select: { email: true },
              },
            },
          },
        },
      }),
      this.prisma.tr_remote_work_requests.count({ where }),
    ]);

    this.logger.log(
      `[listSubordinates] Found ${data.length} requests out of ${total}`,
    );

    const totalPages = Math.ceil(total / limit);
    return { data, meta: { page, limit, total, totalPages } };
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

    const request = await this.prisma.tr_remote_work_requests.create({
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

    // Notify supervisor
    if (user.tr_employees.supervisor_id) {
      this.logger.log(
        `[Create] Notifying supervisor_id=${user.tr_employees.supervisor_id} about request from employee_id=${user.tr_employees.id}`,
      );
      const supervisor = await this.prisma.tr_employees.findUnique({
        where: { id: user.tr_employees.supervisor_id },
        include: { tr_users: true },
      });
      if (supervisor?.tr_users) {
        this.logger.log(
          `[Create] Sending notif to supervisor user_id=${supervisor.tr_users.id}, name=${supervisor.full_name}`,
        );
        await this.notificationService.createNotificationInternal(
          supervisor.tr_users.id,
          'remote_work_request',
          'Permintaan WFH Baru',
          `${user.tr_employees.full_name} mengajukan WFH dari ${dto.start_date} s/d ${dto.end_date}`,
          'remote_work',
          request.id,
        );
      } else {
        this.logger.warn(
          `[Create] Supervisor employee_id=${user.tr_employees.supervisor_id} has no linked user`,
        );
      }
    } else {
      this.logger.warn(
        `[Create] Employee ${user.tr_employees.id} has no supervisor_id`,
      );
    }

    return request;
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

    let updatedRequest;

    if (dto.action === 'approve') {
      // Only update current_remote_work_id if this request is currently active
      // or if there's no existing active WFH. Don't overwrite current active WFH with a future one.
      const todayStr = new Date().toISOString().split('T')[0];
      const reqStartStr = new Date(request.start_date)
        .toISOString()
        .split('T')[0];
      const reqEndStr = new Date(request.end_date).toISOString().split('T')[0];
      const isCurrentlyActive =
        reqStartStr <= todayStr && reqEndStr >= todayStr;

      if (isCurrentlyActive) {
        this.logger.log(
          `[Approve] Request is currently active. Updating employee ${request.employee_id} current_remote_work_id=${requestId}`,
        );
        await this.prisma.tr_employees.update({
          where: { id: request.employee_id },
          data: { current_remote_work_id: requestId },
        });
        this.logger.log(`[Approve] Employee updated successfully`);
      } else {
        this.logger.log(
          `[Approve] Request is for future dates (${reqStartStr} s/d ${reqEndStr}), not updating current_remote_work_id to avoid overwriting active WFH`,
        );
      }

      updatedRequest = await this.prisma.tr_remote_work_requests.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          approved_at: new Date(),
        },
      });

      // Notify employee
      this.logger.log(
        `[Approve] Sending approval notif to requester employee_id=${request.employee_id}`,
      );
      await this.notifyEmployee(
        request.employee_id,
        'WFH Disetujui',
        `Permintaan WFH kamu dari ${request.start_date.toISOString().split('T')[0]} s/d ${request.end_date.toISOString().split('T')[0]} telah disetujui`,
        requestId,
      );
    } else {
      await this.prisma.tr_employees.updateMany({
        where: {
          id: request.employee_id,
          current_remote_work_id: requestId,
        },
        data: { current_remote_work_id: null },
      });

      updatedRequest = await this.prisma.tr_remote_work_requests.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          rejected_reason: dto.rejection_reason || 'Rejected by supervisor',
        },
      });

      // Notify employee
      this.logger.log(
        `[Reject] Sending rejection notif to requester employee_id=${request.employee_id}`,
      );
      await this.notifyEmployee(
        request.employee_id,
        'WFH Ditolak',
        `Permintaan WFH kamu ditolak. Alasan: ${dto.rejection_reason || 'Rejected by supervisor'}`,
        requestId,
      );
    }

    return updatedRequest;
  }

  async cancel(userId: string, requestId: string, reason?: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const request = await this.prisma.tr_remote_work_requests.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Remote work request not found');
    }

    if (request.employee_id !== user.tr_employees.id) {
      throw new ForbiddenException('You can only cancel your own request');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    const updatedRequest = await this.prisma.tr_remote_work_requests.update({
      where: { id: requestId },
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
        cancelled_reason: reason || null,
      },
    });

    // Notify supervisor
    if (request.supervisor_id) {
      const supervisor = await this.prisma.tr_employees.findUnique({
        where: { id: request.supervisor_id },
        include: { tr_users: true },
      });
      if (supervisor?.tr_users) {
        await this.notificationService.createNotificationInternal(
          supervisor.tr_users.id,
          'remote_work_cancelled',
          'WFH Dibatalkan',
          `${user.tr_employees.full_name} membatalkan permintaan WFH dari ${request.start_date.toISOString().split('T')[0]} s/d ${request.end_date.toISOString().split('T')[0]}${reason ? `. Alasan: ${reason}` : ''}`,
          'remote_work',
          requestId,
        );
      }
    }

    return updatedRequest;
  }

  private async notifyEmployee(
    employeeId: string,
    title: string,
    message: string,
    requestId: string,
  ) {
    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: employeeId },
      include: { tr_users: true },
    });
    if (employee?.tr_users) {
      this.logger.log(
        `[Notify] Target: employee_id=${employeeId}, user_id=${employee.tr_users.id}, name=${employee.full_name}, title=${title}`,
      );
      await this.notificationService.createNotificationInternal(
        employee.tr_users.id,
        'remote_work_status',
        title,
        message,
        'remote_work',
        requestId,
      );
    } else {
      this.logger.warn(
        `[Notify] Cannot notify employee_id=${employeeId}: no user linked`,
      );
    }
  }
}
