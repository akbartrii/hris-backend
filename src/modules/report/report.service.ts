import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AttendanceReportDto,
  LeaveReportDto,
  PayrollReportDto,
} from './dto/report.dto';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  private isAdminOrHRD(role: string): boolean {
    return ['hrd', 'admin', 'super_admin'].includes(role);
  }

  private async getEmployeeIdsByDepartment(
    departmentId: string,
  ): Promise<string[]> {
    const employees = await this.prisma.tr_employees.findMany({
      where: { department_id: departmentId },
      select: { id: true },
    });
    return employees.map((e) => e.id);
  }

  async attendanceReport(userRole: string, query: AttendanceReportDto) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only Admin/HRD can access reports');
    }

    const where: any = {};

    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.attendance_date = { gte: startDate, lte: endDate };
    }

    if (query.employee_id) {
      where.employee_id = query.employee_id;
    }

    if (query.department_id) {
      const employeeIds = await this.getEmployeeIdsByDepartment(
        query.department_id,
      );
      where.employee_id = { in: employeeIds };
    }

    const data = await this.prisma.tr_attendances.findMany({
      where,
      orderBy: { attendance_date: 'desc' },
      include: {
        tr_employees: {
          include: {
            ms_departments_tr_employees_department_idToms_departments: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const summary = {
      total_records: data.length,
      present_count: data.filter((a) => a.status === 'present').length,
      late_count: data.filter((a) => a.status === 'late').length,
      absent_count: data.filter((a) => !a.clock_in).length,
      total_late_deduction: data.reduce(
        (sum, a) => sum + Number(a.late_deduction || 0),
        0,
      ),
    };

    return { data, summary };
  }

  async leaveReport(userRole: string, query: LeaveReportDto) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only Admin/HRD can access reports');
    }

    const where: any = {};

    if (query.year) {
      const year = Number(query.year);
      where.start_date = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.department_id) {
      const employeeIds = await this.getEmployeeIdsByDepartment(
        query.department_id,
      );
      where.employee_id = { in: employeeIds };
    }

    const data = await this.prisma.tr_leave_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        ms_leave_types: true,
        tr_employees_tr_leave_requests_employee_idTotr_employees: {
          include: {
            ms_departments_tr_employees_department_idToms_departments: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const summary = {
      total_requests: data.length,
      approved_count: data.filter((l) => l.status === 'approved').length,
      rejected_count: data.filter((l) => l.status === 'rejected').length,
      pending_count: data.filter((l) => l.status === 'pending').length,
      total_days: data.reduce((sum, l) => sum + (l.total_days || 0), 0),
    };

    return { data, summary };
  }

  async payrollReport(userRole: string, query: PayrollReportDto) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only Admin/HRD can access reports');
    }

    const where: any = {};

    if (query.payroll_period_id) {
      where.payroll_period_id = query.payroll_period_id;
    }

    if (query.department_id) {
      const employeeIds = await this.getEmployeeIdsByDepartment(
        query.department_id,
      );
      where.employee_id = { in: employeeIds };
    }

    const data = await this.prisma.tr_payslips.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        tr_payroll_periods: true,
        tr_employees: {
          include: {
            ms_departments_tr_employees_department_idToms_departments: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const summary = {
      total_payslips: data.length,
      total_gross_income: data.reduce(
        (sum, p) => sum + Number(p.gross_income || 0),
        0,
      ),
      total_deductions: data.reduce(
        (sum, p) => sum + Number(p.total_deductions || 0),
        0,
      ),
      total_net_income: data.reduce(
        (sum, p) => sum + Number(p.net_income || 0),
        0,
      ),
    };

    return { data, summary };
  }
}
