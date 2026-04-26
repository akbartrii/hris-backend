import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import {
  AttendanceReportDto,
  LeaveReportDto,
  PayrollReportDto,
} from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('hrd', 'admin', 'super_admin')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('attendance')
  async attendanceReport(
    @CurrentUser('role') role: string,
    @Query() query: AttendanceReportDto,
  ) {
    return this.reportService.attendanceReport(role, query);
  }

  @Get('leave')
  async leaveReport(
    @CurrentUser('role') role: string,
    @Query() query: LeaveReportDto,
  ) {
    return this.reportService.leaveReport(role, query);
  }

  @Get('payroll')
  async payrollReport(
    @CurrentUser('role') role: string,
    @Query() query: PayrollReportDto,
  ) {
    return this.reportService.payrollReport(role, query);
  }
}
