import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeneratePayslipDto, ListPayslipDto } from './dto/generate-payslip.dto';

@Injectable()
export class PayrollService {
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

  private isAdminOrHRD(role: string): boolean {
    return ['hrd', 'admin', 'super_admin'].includes(role);
  }

  // MOCK: PPh21 calculation (placeholder)
  private calculatePPh21(grossIncome: number): number {
    // Placeholder: 5% flat rate for now
    return Number((grossIncome * 0.05).toFixed(2));
  }

  // MOCK: BPJS calculation (placeholder)
  private calculateBPJS(
    baseSalary: number,
    bpjsPaymentType: string,
  ): { kesehatan: number; ketenagakerjaan: number } {
    if (bpjsPaymentType === 'company') {
      return { kesehatan: 0, ketenagakerjaan: 0 };
    }
    // 1% + 2% placeholder
    return {
      kesehatan: Number((baseSalary * 0.01).toFixed(2)),
      ketenagakerjaan: Number((baseSalary * 0.02).toFixed(2)),
    };
  }

  // MOCK: Prorate calculation
  private calculateProrate(
    baseSalary: number,
    fixedAllowance: number,
    workedDays: number,
    effectiveDays: number = 21,
  ): { prorateAmount: number; isProrated: boolean } {
    if (workedDays >= effectiveDays) {
      return { prorateAmount: 0, isProrated: false };
    }
    const daily = (baseSalary + fixedAllowance) / effectiveDays;
    const prorate = Number((daily * workedDays).toFixed(2));
    return { prorateAmount: prorate, isProrated: true };
  }

  async listPayslips(userId: string, query: ListPayslipDto, userRole: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!this.isAdminOrHRD(userRole)) {
      where.employee_id = user.tr_employees.id;
    }

    if (query.payroll_period_id) {
      where.payroll_period_id = query.payroll_period_id;
    }

    const [data, total] = await Promise.all([
      this.prisma.tr_payslips.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { tr_payroll_periods: true },
      }),
      this.prisma.tr_payslips.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async getPayslipDetail(userId: string, payslipId: string, userRole: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const payslip = await this.prisma.tr_payslips.findUnique({
      where: { id: payslipId },
      include: { tr_payroll_periods: true },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    if (
      !this.isAdminOrHRD(userRole) &&
      payslip.employee_id !== user.tr_employees.id
    ) {
      throw new ForbiddenException('You can only view your own payslip');
    }

    return payslip;
  }

  async generatePayslip(
    userId: string,
    dto: GeneratePayslipDto,
    userRole: string,
  ) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only HRD or admin can generate payslips');
    }

    const period = await this.prisma.tr_payroll_periods.findUnique({
      where: { id: dto.payroll_period_id },
    });
    if (!period) {
      throw new NotFoundException('Payroll period not found');
    }

    const targetEmployeeId = dto.employee_id;
    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: targetEmployeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Gather data from attendance & overtime within period
    const attendances = await this.prisma.tr_attendances.findMany({
      where: {
        employee_id: targetEmployeeId,
        attendance_date: {
          gte: period.start_date || new Date(period.year, period.month - 1, 1),
          lte: period.end_date || new Date(period.year, period.month, 0),
        },
      },
    });

    const overtimeRequests = await this.prisma.tr_overtime_requests.findMany({
      where: {
        employee_id: targetEmployeeId,
        status: 'processed',
        date: {
          gte: period.start_date || new Date(period.year, period.month - 1, 1),
          lte: period.end_date || new Date(period.year, period.month, 0),
        },
      },
    });

    const loanDeductions = await this.prisma.tr_loan_deductions.findMany({
      where: {
        employee_id: targetEmployeeId,
        status: 'active',
      },
    });

    // Income
    const baseSalary = Number(employee.base_salary || 0);
    const fixedAllowance = Number(employee.fixed_allowance || 0);
    const phoneAllowance = Number(employee.phone_allowance || 0);
    const dinasAllowance = Number(employee.dinas_allowance || 0);

    const attendanceAllowance = attendances.reduce(
      (sum, a) => sum + Number(a.attendance_allowance || 0),
      0,
    );

    const overtimePay = overtimeRequests.reduce(
      (sum, o) => sum + Number(o.total_overtime_pay || 0),
      0,
    );

    const overtimeMealAllowance = overtimeRequests.reduce(
      (sum, o) => sum + Number(o.total_meal_allowance || 0),
      0,
    );

    // Deductions
    const lateDeduction = attendances.reduce(
      (sum, a) => sum + Number(a.late_deduction || 0),
      0,
    );

    const loanDeduction = loanDeductions.reduce(
      (sum, l) => sum + Number(l.monthly_deduction || 0),
      0,
    );

    const bpjs = this.calculateBPJS(
      baseSalary,
      employee.bpjs_payment_type || 'company',
    );

    // MOCK prorate (placeholder logic: count worked days from attendance)
    const workedDays = attendances.filter(
      (a) => a.clock_in && a.clock_out,
    ).length;
    const prorate = this.calculateProrate(
      baseSalary,
      fixedAllowance,
      workedDays,
    );

    const grossIncome =
      baseSalary +
      fixedAllowance +
      phoneAllowance +
      dinasAllowance +
      attendanceAllowance +
      overtimePay +
      overtimeMealAllowance;

    const totalDeductions =
      lateDeduction + loanDeduction + bpjs.kesehatan + bpjs.ketenagakerjaan;

    const pph21 = this.calculatePPh21(grossIncome);

    const netIncome = grossIncome - totalDeductions - pph21;

    const payslip = await this.prisma.tr_payslips.create({
      data: {
        employee_id: targetEmployeeId,
        payroll_period_id: dto.payroll_period_id,
        base_salary: baseSalary,
        fixed_allowance: fixedAllowance,
        phone_allowance: phoneAllowance,
        dinas_allowance: dinasAllowance,
        attendance_allowance: attendanceAllowance,
        overtime_pay: overtimePay,
        overtime_meal_allowance: overtimeMealAllowance,
        late_deduction: lateDeduction,
        loan_deduction: loanDeduction,
        bpjs_kesehatan: bpjs.kesehatan,
        bpjs_ketenagakerjaan: bpjs.ketenagakerjaan,
        pph21: pph21,
        other_deductions: 0,
        prorate_days_worked: workedDays,
        prorate_days_effective: 21,
        is_prorated: prorate.isProrated,
        gross_income: grossIncome,
        total_deductions: totalDeductions,
        net_income: netIncome,
        pdf_url: null,
        status: 'draft',
      },
    });

    return payslip;
  }

  async publishPayslip(userId: string, payslipId: string, userRole: string) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only HRD or admin can publish payslips');
    }

    const payslip = await this.prisma.tr_payslips.findUnique({
      where: { id: payslipId },
    });
    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    if (payslip.status === 'published') {
      throw new BadRequestException('Payslip already published');
    }

    // Placeholder: generate PDF URL (future: integrate puppeteer or similar)
    const pdfUrl = `https://storage.supabase.co/payslips/${payslipId}.pdf`;

    const updated = await this.prisma.tr_payslips.update({
      where: { id: payslipId },
      data: {
        status: 'published',
        published_at: new Date(),
        pdf_url: pdfUrl,
      },
    });

    return updated;
  }

  async listPayrollPeriods() {
    const periods = await this.prisma.tr_payroll_periods.findMany({
      orderBy: { year: 'desc', month: 'desc' },
    });
    return periods;
  }

  async listTHR(userId: string, userRole: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });
    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const where: any = {};
    if (!this.isAdminOrHRD(userRole)) {
      where.employee_id = user.tr_employees.id;
    }

    const records = await this.prisma.tr_thr_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        tr_employees: { select: { id: true, full_name: true, nik: true } },
      },
    });

    return records;
  }
}
