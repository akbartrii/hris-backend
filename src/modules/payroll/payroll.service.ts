import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfService } from '../../common/services/pdf.service';
import {
  GeneratePayslipDto,
  ListPayslipDto,
  CreatePayrollPeriodDto,
  UpdatePayrollPeriodDto,
  GenerateBatchPayslipDto,
  GenerateTHRDto,
} from './dto/generate-payslip.dto';

const BPJS_KESEHATAN_SALARY_CAP = 9159300;

const PTKP_MAP: Record<string, number> = {
  'TK/0': 54000000,
  'TK/1': 58500000,
  'TK/2': 63000000,
  'TK/3': 67500000,
  'K/0': 58500000,
  'K/1': 63000000,
  'K/2': 67500000,
  'K/3': 72000000,
  'K/I/0': 112500000,
  'K/I/1': 117000000,
  'K/I/2': 121500000,
  'K/I/3': 126000000,
};

const PPH21_BRACKETS = [
  { limit: 50000000, rate: 0.05 },
  { limit: 250000000, rate: 0.15 },
  { limit: 500000000, rate: 0.25 },
  { limit: Infinity, rate: 0.3 },
];

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  private isAdminOrHRD(role: string): boolean {
    return ['hrd', 'admin', 'super_admin'].includes(role);
  }

  private calculatePPh21(
    monthlyGrossIncome: number,
    ptkpStatus: string = 'TK/0',
  ): number {
    const annualIncome = monthlyGrossIncome * 12;
    const ptkp = PTKP_MAP[ptkpStatus] ?? PTKP_MAP['TK/0'];
    const pkp = Math.max(0, annualIncome - ptkp);

    let tax = 0;
    let prevLimit = 0;
    for (const bracket of PPH21_BRACKETS) {
      if (pkp <= prevLimit) break;
      const taxableInBracket = Math.min(pkp, bracket.limit) - prevLimit;
      tax += taxableInBracket * bracket.rate;
      prevLimit = bracket.limit;
    }

    return Number((tax / 12).toFixed(2));
  }

  private calculateBPJS(
    baseSalary: number,
    bpjsPaymentType: string | null,
  ): { kesehatan: number; ketenagakerjaan: number } {
    if (bpjsPaymentType === 'company') {
      return { kesehatan: 0, ketenagakerjaan: 0 };
    }
    const kesehatanCap = Math.min(baseSalary, BPJS_KESEHATAN_SALARY_CAP);
    const kesehatan = Number((kesehatanCap * 0.01).toFixed(2));
    const jht = Number((baseSalary * 0.02).toFixed(2));
    const jkm = Number((baseSalary * 0.003).toFixed(2));
    const jkk = Number((baseSalary * 0.0024).toFixed(2));
    const ketenagakerjaan = Number((jht + jkm + jkk).toFixed(2));
    return { kesehatan, ketenagakerjaan };
  }

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

  private computeMonthsWorked(joinDate: Date, referenceDate: Date): number {
    let months =
      (referenceDate.getFullYear() - joinDate.getFullYear()) * 12 +
      (referenceDate.getMonth() - joinDate.getMonth());
    if (referenceDate.getDate() < joinDate.getDate()) {
      months -= 1;
    }
    return Math.max(1, Math.min(12, months));
  }

  private async buildPayslipData(
    employeeId: string,
    period: {
      id: string;
      month: number;
      year: number;
      start_date: Date | null;
      end_date: Date | null;
      attendance_cutoff_start: Date | null;
      attendance_cutoff_end: Date | null;
    },
    ptkpStatus: string = 'TK/0',
  ) {
    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const cutoffStart =
      period.attendance_cutoff_start ??
      period.start_date ??
      new Date(period.year, period.month - 1, 1);
    const cutoffEnd =
      period.attendance_cutoff_end ??
      period.end_date ??
      new Date(period.year, period.month, 0);

    const [attendances, overtimeRequests, loanDeductions] = await Promise.all([
      this.prisma.tr_attendances.findMany({
        where: {
          employee_id: employeeId,
          attendance_date: { gte: cutoffStart, lte: cutoffEnd },
        },
      }),
      this.prisma.tr_overtime_requests.findMany({
        where: {
          employee_id: employeeId,
          status: 'processed',
          date: { gte: cutoffStart, lte: cutoffEnd },
        },
      }),
      this.prisma.tr_loan_deductions.findMany({
        where: {
          employee_id: employeeId,
          status: 'active',
        },
      }),
    ]);

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
    const lateDeduction = attendances.reduce(
      (sum, a) => sum + Number(a.late_deduction || 0),
      0,
    );

    const workedDays = attendances.filter(
      (a) => a.clock_in && a.clock_out,
    ).length;
    const prorate = this.calculateProrate(
      baseSalary,
      fixedAllowance,
      workedDays,
    );

    let effectiveBaseSalary: number;
    let effectiveFixedAllowance: number;
    if (prorate.isProrated) {
      effectiveBaseSalary = prorate.prorateAmount;
      effectiveFixedAllowance = 0;
    } else {
      effectiveBaseSalary = baseSalary;
      effectiveFixedAllowance = fixedAllowance;
    }

    const grossIncome =
      effectiveBaseSalary +
      effectiveFixedAllowance +
      phoneAllowance +
      dinasAllowance +
      attendanceAllowance +
      overtimePay +
      overtimeMealAllowance;

    const bpjs = this.calculateBPJS(
      baseSalary,
      employee.bpjs_payment_type || 'company',
    );

    const loanDeductionAmount = loanDeductions.reduce((sum, l) => {
      const monthlyDeduction = Number(l.monthly_deduction || 0);
      const remaining = Number(l.remaining_amount || 0);
      return sum + Math.min(monthlyDeduction, remaining);
    }, 0);

    const totalDeductions =
      lateDeduction +
      loanDeductionAmount +
      bpjs.kesehatan +
      bpjs.ketenagakerjaan;

    const pph21 = this.calculatePPh21(grossIncome, ptkpStatus);
    const netIncome = Number(
      (grossIncome - totalDeductions - pph21).toFixed(2),
    );

    return {
      employee,
      baseSalary,
      effectiveBaseSalary,
      effectiveFixedAllowance,
      phoneAllowance,
      dinasAllowance,
      attendanceAllowance,
      overtimePay,
      overtimeMealAllowance,
      lateDeduction,
      loanDeductionAmount,
      bpjs,
      pph21,
      workedDays,
      isProrated: prorate.isProrated,
      grossIncome,
      totalDeductions,
      netIncome,
      loanDeductions,
    };
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

    const existing = await this.prisma.tr_payslips.findFirst({
      where: {
        employee_id: dto.employee_id,
        payroll_period_id: dto.payroll_period_id,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Payslip already exists for this employee and period',
      );
    }

    const ptkpStatus = (dto as any).ptkp_status || 'TK/0';
    const data = await this.buildPayslipData(
      dto.employee_id,
      period,
      ptkpStatus,
    );

    const [payslip] = await this.prisma.$transaction([
      this.prisma.tr_payslips.create({
        data: {
          employee_id: dto.employee_id,
          payroll_period_id: dto.payroll_period_id,
          base_salary: data.effectiveBaseSalary,
          fixed_allowance: data.effectiveFixedAllowance,
          phone_allowance: data.phoneAllowance,
          dinas_allowance: data.dinasAllowance,
          attendance_allowance: data.attendanceAllowance,
          overtime_pay: data.overtimePay,
          overtime_meal_allowance: data.overtimeMealAllowance,
          late_deduction: data.lateDeduction,
          loan_deduction: data.loanDeductionAmount,
          bpjs_kesehatan: data.bpjs.kesehatan,
          bpjs_ketenagakerjaan: data.bpjs.ketenagakerjaan,
          pph21: data.pph21,
          other_deductions: 0,
          prorate_days_worked: data.workedDays,
          prorate_days_effective: 21,
          is_prorated: data.isProrated,
          gross_income: data.grossIncome,
          total_deductions: data.totalDeductions,
          net_income: data.netIncome,
          pdf_url: null,
          status: 'draft',
        },
      }),
    ]);

    await this.updateLoanBalances(data.loanDeductions as any[]);

    return payslip;
  }

  private async updateLoanBalances(
    loans: {
      id: string;
      monthly_deduction: number | null;
      remaining_amount: number | null;
    }[],
  ) {
    for (const loan of loans) {
      const monthlyDeduction = Number(loan.monthly_deduction || 0);
      const remaining = Number(loan.remaining_amount || 0);
      const deduction = Math.min(monthlyDeduction, remaining);
      const newRemaining = Number((remaining - deduction).toFixed(2));

      if (newRemaining <= 0) {
        await this.prisma.tr_loan_deductions.update({
          where: { id: loan.id },
          data: { remaining_amount: 0, status: 'paid_off' },
        });
      } else {
        await this.prisma.tr_loan_deductions.update({
          where: { id: loan.id },
          data: { remaining_amount: newRemaining },
        });
      }
    }
  }

  async generateBatchPayslip(
    userId: string,
    dto: GenerateBatchPayslipDto,
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

    const departments = await this.prisma.ms_departments.findMany({
      where: { company_id: period.company_id },
      select: { id: true },
    });
    const departmentIds = departments.map((d) => d.id);

    const employees = await this.prisma.tr_employees.findMany({
      where: {
        is_active: true,
        department_id: { in: departmentIds },
      },
      select: { id: true },
    });

    const existingPayslips = await this.prisma.tr_payslips.findMany({
      where: {
        payroll_period_id: dto.payroll_period_id,
        employee_id: { in: employees.map((e) => e.id) },
      },
      select: { employee_id: true },
    });
    const existingEmployeeIds = new Set(
      existingPayslips.map((p) => p.employee_id),
    );

    const results: { employee_id: string; status: string; error?: string }[] =
      [];

    for (const emp of employees) {
      if (existingEmployeeIds.has(emp.id)) {
        results.push({
          employee_id: emp.id,
          status: 'skipped',
          error: 'Payslip already exists',
        });
        continue;
      }

      try {
        const data = await this.buildPayslipData(emp.id, period, 'TK/0');

        await this.prisma.$transaction([
          this.prisma.tr_payslips.create({
            data: {
              employee_id: emp.id,
              payroll_period_id: dto.payroll_period_id,
              base_salary: data.effectiveBaseSalary,
              fixed_allowance: data.effectiveFixedAllowance,
              phone_allowance: data.phoneAllowance,
              dinas_allowance: data.dinasAllowance,
              attendance_allowance: data.attendanceAllowance,
              overtime_pay: data.overtimePay,
              overtime_meal_allowance: data.overtimeMealAllowance,
              late_deduction: data.lateDeduction,
              loan_deduction: data.loanDeductionAmount,
              bpjs_kesehatan: data.bpjs.kesehatan,
              bpjs_ketenagakerjaan: data.bpjs.ketenagakerjaan,
              pph21: data.pph21,
              other_deductions: 0,
              prorate_days_worked: data.workedDays,
              prorate_days_effective: 21,
              is_prorated: data.isProrated,
              gross_income: data.grossIncome,
              total_deductions: data.totalDeductions,
              net_income: data.netIncome,
              pdf_url: null,
              status: 'draft',
            },
          }),
        ]);

        await this.updateLoanBalances(data.loanDeductions as any[]);

        results.push({ employee_id: emp.id, status: 'created' });
      } catch (err) {
        results.push({
          employee_id: emp.id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      total: employees.length,
      created: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      details: results,
    };
  }

  async publishPayslip(userId: string, payslipId: string, userRole: string) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only HRD or admin can publish payslips');
    }

    const payslip = await this.prisma.tr_payslips.findUnique({
      where: { id: payslipId },
      include: {
        tr_employees: { select: { full_name: true, nik: true } },
        tr_payroll_periods: { select: { period_name: true } },
      },
    });
    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }
    if (payslip.status === 'published') {
      throw new BadRequestException('Payslip already published');
    }

    const pdfBuffer = await this.pdfService.generatePayslipPdf({
      employeeName: payslip.tr_employees?.full_name || '-',
      nik: payslip.tr_employees?.nik || '-',
      periodName: payslip.tr_payroll_periods?.period_name || '-',
      baseSalary: Number(payslip.base_salary || 0),
      fixedAllowance: Number(payslip.fixed_allowance || 0),
      phoneAllowance: Number(payslip.phone_allowance || 0),
      dinasAllowance: Number(payslip.dinas_allowance || 0),
      attendanceAllowance: Number(payslip.attendance_allowance || 0),
      overtimePay: Number(payslip.overtime_pay || 0),
      overtimeMealAllowance: Number(payslip.overtime_meal_allowance || 0),
      grossIncome: Number(payslip.gross_income || 0),
      lateDeduction: Number(payslip.late_deduction || 0),
      loanDeduction: Number(payslip.loan_deduction || 0),
      bpjsKesehatan: Number(payslip.bpjs_kesehatan || 0),
      bpjsKetenagakerjaan: Number(payslip.bpjs_ketenagakerjaan || 0),
      pph21: Number(payslip.pph21 || 0),
      totalDeductions: Number(payslip.total_deductions || 0),
      netIncome: Number(payslip.net_income || 0),
    });

    // TODO: Upload pdfBuffer to cloud storage and get real URL
    const pdfUrl = `https://storage.supabase.co/payslips/${payslipId}.pdf`;

    return this.prisma.tr_payslips.update({
      where: { id: payslipId },
      data: {
        status: 'published',
        published_at: new Date(),
        pdf_url: pdfUrl,
      },
    });
  }

  async listPayrollPeriods(companyId?: string) {
    const where: any = {};
    if (companyId) {
      where.company_id = companyId;
    }
    return this.prisma.tr_payroll_periods.findMany({
      where,
      orderBy: { year: 'desc' },
    });
  }

  async createPeriod(dto: CreatePayrollPeriodDto, userRole: string) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException(
        'Only HRD or admin can create payroll periods',
      );
    }

    const existing = await this.prisma.tr_payroll_periods.findFirst({
      where: {
        company_id: dto.company_id,
        month: dto.month,
        year: dto.year,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Payroll period already exists for this company, month, and year',
      );
    }

    return this.prisma.tr_payroll_periods.create({
      data: {
        company_id: dto.company_id,
        month: dto.month,
        year: dto.year,
        period_name: dto.period_name,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        attendance_cutoff_start: dto.attendance_cutoff_start
          ? new Date(dto.attendance_cutoff_start)
          : null,
        attendance_cutoff_end: dto.attendance_cutoff_end
          ? new Date(dto.attendance_cutoff_end)
          : null,
        payment_date: dto.payment_date ? new Date(dto.payment_date) : null,
        status: 'draft',
      },
    });
  }

  async updatePeriod(
    periodId: string,
    dto: UpdatePayrollPeriodDto,
    userRole: string,
  ) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException(
        'Only HRD or admin can update payroll periods',
      );
    }

    const period = await this.prisma.tr_payroll_periods.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException('Payroll period not found');
    }
    if (period.status === 'published' || period.status === 'closed') {
      throw new BadRequestException(
        'Cannot update a published or closed payroll period',
      );
    }

    const data: any = {};
    if (dto.period_name !== undefined) data.period_name = dto.period_name;
    if (dto.start_date !== undefined)
      data.start_date = new Date(dto.start_date);
    if (dto.end_date !== undefined) data.end_date = new Date(dto.end_date);
    if (dto.attendance_cutoff_start !== undefined)
      data.attendance_cutoff_start = new Date(dto.attendance_cutoff_start);
    if (dto.attendance_cutoff_end !== undefined)
      data.attendance_cutoff_end = new Date(dto.attendance_cutoff_end);
    if (dto.payment_date !== undefined)
      data.payment_date = new Date(dto.payment_date);
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.tr_payroll_periods.update({
      where: { id: periodId },
      data,
    });
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

    return this.prisma.tr_thr_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        tr_employees: { select: { id: true, full_name: true, nik: true } },
      },
    });
  }

  async generateTHR(userId: string, dto: GenerateTHRDto, userRole: string) {
    if (!this.isAdminOrHRD(userRole)) {
      throw new ForbiddenException('Only HRD or admin can generate THR');
    }

    const employee = await this.prisma.tr_employees.findUnique({
      where: { id: dto.employee_id },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (!employee.join_date) {
      throw new BadRequestException('Employee join date is not set');
    }

    const existing = await this.prisma.tr_thr_records.findFirst({
      where: {
        employee_id: dto.employee_id,
        period_name: dto.period_name,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'THR record already exists for this employee and period',
      );
    }

    const baseSalary = Number(employee.base_salary || 0);
    const monthsWorked = this.computeMonthsWorked(
      new Date(employee.join_date),
      new Date(),
    );
    const thrAmount = Number(((baseSalary / 12) * monthsWorked).toFixed(2));

    return this.prisma.tr_thr_records.create({
      data: {
        employee_id: dto.employee_id,
        period_name: dto.period_name,
        base_salary: baseSalary,
        months_worked: monthsWorked,
        thr_amount: thrAmount,
        is_prorated: monthsWorked < 12,
        status: 'draft',
      },
    });
  }
}
