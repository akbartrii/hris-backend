import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { ApproveCorrectionDto } from './dto/approve-correction.dto';
import { ListAttendanceDto } from './dto/list-attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly LATE_TOLERANCE_MINUTES = 5;
  private readonly LATE_DEDUCTION_PER_HOUR = 5000;
  private readonly DEFAULT_RADIUS_METERS = 100;
  private readonly STORAGE_BUCKET = 'attendance-photos';

  constructor(
    private prisma: PrismaService,
    private storageService: SupabaseStorageService,
  ) {}

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

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

  private async getEmployeeSchedule(employeeId: string, date: Date) {
    const schedule = await this.prisma.tr_employee_schedules.findFirst({
      where: {
        employee_id: employeeId,
        effective_date: { lte: date },
        OR: [{ end_date: null }, { end_date: { gte: date } }],
      },
      include: { ms_work_schedules: true },
      orderBy: { effective_date: 'desc' },
    });
    return schedule?.ms_work_schedules || null;
  }

  private async validateGPS(
    employeeId: string,
    lat: number,
    lng: number,
  ): Promise<{ isValid: boolean; distance: number; locationId?: string }> {
    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: employeeId },
      include: { ms_locations: true },
    });

    if (!employee || !employee.ms_locations) {
      return { isValid: true, distance: 0 };
    }

    const location = employee.ms_locations;
    const radius = location.radius_meters || this.DEFAULT_RADIUS_METERS;

    const distance = this.calculateDistance(
      Number(location.latitude),
      Number(location.longitude),
      lat,
      lng,
    );

    return {
      isValid: distance <= radius,
      distance: Math.round(distance),
      locationId: location.id,
    };
  }

  private calculateLateMinutes(
    clockIn: Date,
    scheduleStartTime: Date | null,
  ): number {
    if (!scheduleStartTime) return 0;

    const scheduleMinutes =
      scheduleStartTime.getHours() * 60 + scheduleStartTime.getMinutes();
    const clockInMinutes = clockIn.getHours() * 60 + clockIn.getMinutes();
    const diff = clockInMinutes - scheduleMinutes;

    return diff > this.LATE_TOLERANCE_MINUTES ? diff : 0;
  }

  private calculateEarlyLeaveMinutes(
    clockOut: Date,
    scheduleEndTime: Date | null,
  ): number {
    if (!scheduleEndTime) return 0;

    const scheduleMinutes =
      scheduleEndTime.getHours() * 60 + scheduleEndTime.getMinutes();
    const clockOutMinutes = clockOut.getHours() * 60 + clockOut.getMinutes();
    const diff = scheduleMinutes - clockOutMinutes;

    return diff > this.LATE_TOLERANCE_MINUTES ? diff : 0;
  }

  async clockIn(userId: string, dto: ClockInDto, photo: Express.Multer.File) {
    const employee = await this.getEmployeeFromUser(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.tr_attendances.findFirst({
      where: {
        employee_id: employee.id,
        attendance_date: today,
      },
    });

    if (existing?.clock_in) {
      throw new BadRequestException('Already clocked in today');
    }

    const gpsValidation = await this.validateGPS(employee.id, dto.lat, dto.lng);

    if (!gpsValidation.isValid) {
      throw new BadRequestException(
        `You are ${gpsValidation.distance}m away from the assigned location. Maximum allowed is ${this.DEFAULT_RADIUS_METERS}m.`,
      );
    }

    const dateStr = today.toISOString().split('T')[0];
    const photoPath = `${employee.id}/${dateStr}_clock_in.jpg`;
    const photoUrl = await this.storageService.uploadFile(
      this.STORAGE_BUCKET,
      photoPath,
      photo.buffer,
      photo.mimetype,
    );

    const schedule = await this.getEmployeeSchedule(employee.id, today);
    const now = new Date();
    const lateMinutes = this.calculateLateMinutes(
      now,
      schedule?.start_time || null,
    );

    const lateHours = Math.ceil(lateMinutes / 60);
    const lateDeduction = lateHours * this.LATE_DEDUCTION_PER_HOUR;

    const attendance = await this.prisma.tr_attendances.upsert({
      where: {
        employee_id_attendance_date: {
          employee_id: employee.id,
          attendance_date: today,
        },
      },
      update: {
        clock_in: now,
        clock_in_lat: dto.lat,
        clock_in_lng: dto.lng,
        clock_in_photo_url: photoUrl,
        clock_in_distance: gpsValidation.distance,
        location_id: gpsValidation.locationId,
        status: lateMinutes > 0 ? 'late' : 'present',
        late_minutes: lateMinutes,
        late_deduction: lateDeduction,
        notes: dto.notes,
      },
      create: {
        employee_id: employee.id,
        attendance_date: today,
        clock_in: now,
        clock_in_lat: dto.lat,
        clock_in_lng: dto.lng,
        clock_in_photo_url: photoUrl,
        clock_in_distance: gpsValidation.distance,
        location_id: gpsValidation.locationId,
        status: lateMinutes > 0 ? 'late' : 'present',
        late_minutes: lateMinutes,
        late_deduction: lateDeduction,
        notes: dto.notes,
      },
    });

    return attendance;
  }

  async clockOut(userId: string, dto: ClockOutDto, photo: Express.Multer.File) {
    const employee = await this.getEmployeeFromUser(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.tr_attendances.findFirst({
      where: {
        employee_id: employee.id,
        attendance_date: today,
      },
    });

    if (!attendance || !attendance.clock_in) {
      throw new BadRequestException('You must clock in before clocking out');
    }

    if (attendance.clock_out) {
      throw new BadRequestException('Already clocked out today');
    }

    const gpsValidation = await this.validateGPS(employee.id, dto.lat, dto.lng);

    if (!gpsValidation.isValid) {
      throw new BadRequestException(
        `You are ${gpsValidation.distance}m away from the assigned location. Maximum allowed is ${this.DEFAULT_RADIUS_METERS}m.`,
      );
    }

    const dateStr = today.toISOString().split('T')[0];
    const photoPath = `${employee.id}/${dateStr}_clock_out.jpg`;
    const photoUrl = await this.storageService.uploadFile(
      this.STORAGE_BUCKET,
      photoPath,
      photo.buffer,
      photo.mimetype,
    );

    const schedule = await this.getEmployeeSchedule(employee.id, today);
    const now = new Date();
    const earlyLeaveMinutes = this.calculateEarlyLeaveMinutes(
      now,
      schedule?.end_time || null,
    );

    const updated = await this.prisma.tr_attendances.update({
      where: { id: attendance.id },
      data: {
        clock_out: now,
        clock_out_lat: dto.lat,
        clock_out_lng: dto.lng,
        clock_out_photo_url: photoUrl,
        clock_out_distance: gpsValidation.distance,
        early_leave_minutes: earlyLeaveMinutes,
        notes: dto.notes || attendance.notes,
      },
    });

    return updated;
  }

  async listAttendance(userId: string, query: ListAttendanceDto) {
    const employee = await this.getEmployeeFromUser(userId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { employee_id: employee.id };

    if (query.date) {
      where.attendance_date = new Date(query.date);
    }

    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.attendance_date = { gte: startDate, lte: endDate };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.tr_attendances.findMany({
        where,
        skip,
        take: limit,
        orderBy: { attendance_date: 'desc' },
        include: { ms_locations: true },
      }),
      this.prisma.tr_attendances.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total },
    };
  }

  async createCorrection(userId: string, dto: CreateCorrectionDto) {
    const employee = await this.getEmployeeFromUser(userId);

    const attendance = await this.prisma.tr_attendances.findFirst({
      where: {
        id: dto.attendance_id,
        employee_id: employee.id,
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    const correction = await this.prisma.tr_attendance_corrections.create({
      data: {
        attendance_id: dto.attendance_id,
        employee_id: employee.id,
        submitted_by: userId,
        correction_type: dto.correction_type,
        correct_clock_in: dto.correct_clock_in
          ? new Date(`1970-01-01T${dto.correct_clock_in}:00`)
          : null,
        correct_clock_out: dto.correct_clock_out
          ? new Date(`1970-01-01T${dto.correct_clock_out}:00`)
          : null,
        reason: dto.reason,
        status: 'pending',
      },
    });

    return correction;
  }

  async listCorrections(userId: string, query: any) {
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
      this.prisma.tr_attendance_corrections.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          tr_attendances: true,
          tr_employees_tr_attendance_corrections_employee_idTotr_employees: true,
        },
      }),
      this.prisma.tr_attendance_corrections.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total },
    };
  }

  async approveCorrection(
    userId: string,
    correctionId: string,
    dto: ApproveCorrectionDto,
    approverRole: string,
  ) {
    const approver = await this.getEmployeeFromUser(userId);
    const correction = await this.prisma.tr_attendance_corrections.findUnique({
      where: { id: correctionId },
      include: { tr_attendances: true },
    });

    if (!correction) {
      throw new NotFoundException('Correction request not found');
    }

    if (
      correction.status !== 'pending' &&
      correction.status !== 'supervisor_approved'
    ) {
      throw new BadRequestException('Correction request already processed');
    }

    if (approverRole === 'atasan') {
      if (correction.status !== 'pending') {
        throw new BadRequestException('Correction request already processed');
      }

      if (dto.action === 'approve') {
        await this.prisma.tr_attendance_corrections.update({
          where: { id: correctionId },
          data: {
            supervisor_approved_at: new Date(),
            supervisor_id: approver.id,
            status: 'supervisor_approved',
          },
        });
      } else {
        await this.prisma.tr_attendance_corrections.update({
          where: { id: correctionId },
          data: {
            supervisor_id: approver.id,
            status: 'rejected',
            rejection_reason: dto.rejection_reason || 'Rejected by supervisor',
          },
        });
      }
      return { message: `Correction ${dto.action}d by supervisor` };
    }

    if (
      approverRole === 'manager_hrga' ||
      approverRole === 'admin' ||
      approverRole === 'super_admin'
    ) {
      if (correction.status !== 'supervisor_approved') {
        throw new BadRequestException('Must be approved by supervisor first');
      }

      if (dto.action === 'approve') {
        const updateData: any = {};
        if (correction.correct_clock_in) {
          updateData.clock_in = this.combineDateTime(
            correction.tr_attendances.attendance_date,
            correction.correct_clock_in,
          );
        }
        if (correction.correct_clock_out) {
          updateData.clock_out = this.combineDateTime(
            correction.tr_attendances.attendance_date,
            correction.correct_clock_out,
          );
        }

        await this.prisma.tr_attendances.update({
          where: { id: correction.attendance_id },
          data: updateData,
        });

        await this.prisma.tr_attendance_corrections.update({
          where: { id: correctionId },
          data: {
            hrga_approved_at: new Date(),
            hrga_manager_id: approver.id,
            status: 'approved',
          },
        });
      } else {
        await this.prisma.tr_attendance_corrections.update({
          where: { id: correctionId },
          data: {
            hrga_manager_id: approver.id,
            status: 'rejected',
            rejection_reason: dto.rejection_reason || 'Rejected by HRGA',
          },
        });
      }
      return { message: `Correction ${dto.action}d by HRGA` };
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  private combineDateTime(date: Date, time: Date): Date {
    const result = new Date(date);
    result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return result;
  }
}
