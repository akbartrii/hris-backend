import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ParameterService } from '../parameter/parameter.service';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { ApproveOvertimeDto } from './dto/approve-overtime.dto';
import { ListOvertimeDto } from './dto/list-overtime.dto';

@Injectable()
export class OvertimeService {
  constructor(
    private prisma: PrismaService,
    private parameterService: ParameterService,
  ) {}

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

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async roundUpHours(totalMinutes: number): Promise<number> {
    const roundingMinutes = await this.parameterService.getNumber(
      'overtime_rounding_minutes',
      30,
    );
    return Math.ceil(totalMinutes / roundingMinutes) * (roundingMinutes / 60);
  }

  private async determineDayType(
    date: Date,
    companyId: string,
  ): Promise<string> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateOnly);
    nextDay.setDate(nextDay.getDate() + 1);

    const holiday = await this.prisma.ms_holiday_calendars.findFirst({
      where: {
        company_id: companyId,
        holiday_date: { gte: dateOnly, lt: nextDay },
      },
    });

    if (holiday) {
      return 'holiday';
    }

    const dayOfWeek = dateOnly.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';
  }

  private calculateCrossMidnightMinutes(
    startMinutes: number,
    endMinutes: number,
  ): number {
    if (endMinutes > startMinutes) {
      return endMinutes - startMinutes;
    }
    return 1440 - startMinutes + endMinutes;
  }

  private async calculateOvertimePay(
    rawMinutes: number,
    dayType: string,
    ratePerHour: number,
  ): Promise<number> {
    const totalHours = rawMinutes / 60;

    if (dayType === 'weekday') {
      let pay = 0;
      const firstMultiplier = await this.parameterService.getNumber(
        'overtime_weekday_first_hour_multiplier',
        1.5,
      );
      const subsequentMultiplier = await this.parameterService.getNumber(
        'overtime_weekday_subsequent_multiplier',
        2,
      );
      if (totalHours <= 1) {
        pay = totalHours * firstMultiplier;
      } else {
        pay = 1 * firstMultiplier + (totalHours - 1) * subsequentMultiplier;
      }
      return Number((pay * ratePerHour).toFixed(2));
    }

    let pay = 0;
    const weekend8h = await this.parameterService.getNumber(
      'overtime_weekend_first_8h_multiplier',
      2,
    );
    const weekend9_10h = await this.parameterService.getNumber(
      'overtime_weekend_9_10h_multiplier',
      3,
    );
    const weekendBeyond10h = await this.parameterService.getNumber(
      'overtime_weekend_beyond_10h_multiplier',
      4,
    );
    if (totalHours <= 8) {
      pay = totalHours * weekend8h;
    } else if (totalHours <= 10) {
      pay = 8 * weekend8h + (totalHours - 8) * weekend9_10h;
    } else {
      pay =
        8 * weekend8h + 2 * weekend9_10h + (totalHours - 10) * weekendBeyond10h;
    }
    return Number((pay * ratePerHour).toFixed(2));
  }

  private async calculateMealAllowance(
    dayType: string,
    startMinutes: number,
    endMinutes: number,
  ): Promise<number> {
    const allowances = await this.prisma.ms_overtime_meal_allowances.findMany({
      where: { day_type: dayType },
    });

    let totalMeal = 0;

    for (const slot of allowances) {
      const slotStart =
        slot.time_start.getHours() * 60 + slot.time_start.getMinutes();
      const slotEnd =
        slot.time_end.getHours() * 60 + slot.time_end.getMinutes();

      const overlapStart = Math.max(startMinutes, slotStart);
      const overlapEnd = Math.min(endMinutes, slotEnd);

      if (overlapStart < overlapEnd) {
        totalMeal += Number(slot.amount);
      }
    }

    return totalMeal;
  }

  private canSubmitOvertime(role: string): boolean {
    return ['atasan', 'manager_hrga', 'admin', 'super_admin'].includes(role);
  }

  async createOvertime(
    userId: string,
    dto: CreateOvertimeDto,
    requesterRole: string,
  ) {
    if (!this.canSubmitOvertime(requesterRole)) {
      throw new ForbiddenException(
        'Only supervisor or above can submit overtime requests',
      );
    }

    const requester = await this.getEmployeeFromUser(userId);

    const targetEmployee = await this.prisma.tr_employees.findUnique({
      where: { id: dto.employee_id },
    });

    if (!targetEmployee) {
      throw new NotFoundException('Target employee not found');
    }

    if (!['admin', 'super_admin'].includes(requesterRole)) {
      if (
        targetEmployee.supervisor_id !== requester.id &&
        targetEmployee.manager_id !== requester.id
      ) {
        throw new ForbiddenException(
          'You can only submit overtime for your subordinates',
        );
      }
    }

    const overtimeDate = new Date(dto.date);

    const existingOvertime = await this.prisma.tr_overtime_requests.findFirst({
      where: {
        employee_id: dto.employee_id,
        date: overtimeDate,
        status: { notIn: ['rejected', 'cancelled'] },
      },
    });

    if (existingOvertime) {
      throw new BadRequestException(
        'Employee already has an active overtime request for this date',
      );
    }

    const user = await this.prisma.tr_users.findUnique({
      where: { id: targetEmployee.user_id || undefined },
    });
    const companyId = user?.company_id;

    const dayType = await this.determineDayType(overtimeDate, companyId || '');

    const startMinutes = this.timeToMinutes(dto.start_time);
    const endMinutes = this.timeToMinutes(dto.end_time);

    if (startMinutes === endMinutes) {
      throw new BadRequestException('End time must differ from start time');
    }

    const rawMinutes = this.calculateCrossMidnightMinutes(
      startMinutes,
      endMinutes,
    );
    const totalHours = await this.roundUpHours(rawMinutes);

    const baseSalary = Number(targetEmployee.base_salary || 0);
    const fixedAllowance = Number(targetEmployee.fixed_allowance || 0);
    const divisor = await this.parameterService.getNumber(
      'overtime_divisor',
      173,
    );
    const ratePerHour = (baseSalary + fixedAllowance) / divisor;

    const totalOvertimePay = await this.calculateOvertimePay(
      rawMinutes,
      dayType,
      ratePerHour,
    );

    const mealStartMinutes = startMinutes;
    const mealEndMinutes =
      endMinutes > startMinutes ? endMinutes : endMinutes + 1440;

    const totalMealAllowance = await this.calculateMealAllowance(
      dayType,
      mealStartMinutes,
      mealEndMinutes,
    );

    const overtime = await this.prisma.tr_overtime_requests.create({
      data: {
        employee_id: dto.employee_id,
        requested_by: requester.id,
        date: overtimeDate,
        start_time: new Date(`1970-01-01T${dto.start_time}:00`),
        end_time: new Date(`1970-01-01T${dto.end_time}:00`),
        total_hours: totalHours,
        raw_minutes: rawMinutes,
        type: dto.type,
        day_type: dayType,
        description: dto.description,
        rate_per_hour: ratePerHour,
        total_overtime_pay: totalOvertimePay,
        total_meal_allowance: totalMealAllowance,
        status: 'pending',
      },
    });

    return overtime;
  }

  async cancelOvertime(userId: string, overtimeId: string) {
    const employee = await this.getEmployeeFromUser(userId);

    const overtime = await this.prisma.tr_overtime_requests.findUnique({
      where: { id: overtimeId },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime request not found');
    }

    if (overtime.status !== 'pending') {
      throw new BadRequestException(
        'Only pending overtime requests can be cancelled',
      );
    }

    if (
      overtime.requested_by !== employee.id &&
      overtime.employee_id !== employee.id
    ) {
      throw new ForbiddenException(
        'You can only cancel your own overtime requests',
      );
    }

    await this.prisma.tr_overtime_requests.update({
      where: { id: overtimeId },
      data: {
        status: 'cancelled',
        rejection_reason: 'Cancelled by requester',
      },
    });

    return { message: 'Overtime request cancelled' };
  }

  async deleteOvertime(userId: string, overtimeId: string, userRole: string) {
    if (!['admin', 'super_admin'].includes(userRole)) {
      throw new ForbiddenException('Only admin can delete overtime requests');
    }

    const overtime = await this.prisma.tr_overtime_requests.findUnique({
      where: { id: overtimeId },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime request not found');
    }

    if (
      overtime.status !== 'pending' &&
      overtime.status !== 'rejected' &&
      overtime.status !== 'cancelled'
    ) {
      throw new BadRequestException(
        'Can only delete pending, rejected, or cancelled overtime requests',
      );
    }

    await this.prisma.tr_overtime_requests.delete({
      where: { id: overtimeId },
    });

    return { message: 'Overtime request deleted' };
  }

  async listOvertimes(userId: string, query: ListOvertimeDto) {
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

    if (query.employee_id) {
      where.employee_id = query.employee_id;
    }

    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.date = { gte: startDate, lte: endDate };
    }

    const [data, total] = await Promise.all([
      this.prisma.tr_overtime_requests.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          tr_employees_tr_overtime_requests_employee_idTotr_employees: {
            select: { id: true, full_name: true, nik: true },
          },
        },
      }),
      this.prisma.tr_overtime_requests.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async getOvertimeSummary(userId: string, month?: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true, ms_roles: true },
    });

    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const userRole = user.ms_roles?.name || 'karyawan';
    if (!['admin', 'hrd', 'manager_hrga', 'super_admin'].includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    let dateFilter: any = {};
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0);
      dateFilter = { gte: startDate, lte: endDate };
    } else {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = { gte: startDate, lte: endDate };
    }

    const requests = await this.prisma.tr_overtime_requests.findMany({
      where: { date: dateFilter },
      include: {
        tr_employees_tr_overtime_requests_employee_idTotr_employees: {
          select: { id: true, full_name: true, nik: true },
        },
      },
    });

    const summaryMap = new Map<string, any>();

    for (const req of requests) {
      const emp =
        req.tr_employees_tr_overtime_requests_employee_idTotr_employees;
      if (!summaryMap.has(emp.id)) {
        summaryMap.set(emp.id, {
          employee_id: emp.id,
          employee_name: emp.full_name,
          nik: emp.nik,
          total_requests: 0,
          total_hours: 0,
          total_overtime_pay: 0,
          total_meal_allowance: 0,
        });
      }

      const entry = summaryMap.get(emp.id);
      entry.total_requests += 1;
      entry.total_hours += Number(req.total_hours);
      entry.total_overtime_pay += Number(req.total_overtime_pay || 0);
      entry.total_meal_allowance += Number(req.total_meal_allowance || 0);
    }

    return Array.from(summaryMap.values());
  }

  async approveOvertime(
    userId: string,
    overtimeId: string,
    dto: ApproveOvertimeDto,
    approverRole: string,
  ) {
    if (!['manager_hrga', 'admin', 'super_admin'].includes(approverRole)) {
      throw new ForbiddenException(
        'Only manager or above can approve overtime',
      );
    }

    const approver = await this.getEmployeeFromUser(userId);

    const overtime = await this.prisma.tr_overtime_requests.findUnique({
      where: { id: overtimeId },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime request not found');
    }

    if (overtime.status !== 'pending') {
      throw new BadRequestException('Overtime request already processed');
    }

    if (dto.action === 'approve') {
      await this.prisma.tr_overtime_requests.update({
        where: { id: overtimeId },
        data: {
          manager_approved_at: new Date(),
          manager_id: approver.id,
          status: 'approved',
        },
      });
    } else {
      await this.prisma.tr_overtime_requests.update({
        where: { id: overtimeId },
        data: {
          manager_id: approver.id,
          status: 'rejected',
          rejection_reason: dto.rejection_reason || 'Rejected by manager',
        },
      });
    }

    return { message: `Overtime request ${dto.action}d by manager` };
  }

  async processOvertime(
    userId: string,
    overtimeId: string,
    dto: ApproveOvertimeDto,
    processorRole: string,
  ) {
    if (!['hrd', 'admin', 'super_admin'].includes(processorRole)) {
      throw new ForbiddenException('Only HRD or above can process overtime');
    }

    const processor = await this.getEmployeeFromUser(userId);

    const overtime = await this.prisma.tr_overtime_requests.findUnique({
      where: { id: overtimeId },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime request not found');
    }

    if (overtime.status !== 'approved') {
      throw new BadRequestException(
        'Overtime must be approved by manager first',
      );
    }

    if (dto.action === 'approve') {
      await this.prisma.tr_overtime_requests.update({
        where: { id: overtimeId },
        data: {
          hrd_processed_at: new Date(),
          hrd_id: processor.id,
          status: 'processed',
        },
      });
    } else {
      await this.prisma.tr_overtime_requests.update({
        where: { id: overtimeId },
        data: {
          hrd_id: processor.id,
          status: 'rejected',
          rejection_reason: dto.rejection_reason || 'Rejected by HRD',
        },
      });
    }

    return { message: `Overtime request ${dto.action}d by HRD` };
  }
}
