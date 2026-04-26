import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import {
  GeneratePayslipDto,
  ListPayslipDto,
  PublishPayslipDto,
  GenerateBatchPayslipDto,
  GenerateTHRDto,
  CreatePayrollPeriodDto,
  UpdatePayrollPeriodDto,
} from './dto/generate-payslip.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('payslips')
  async listPayslips(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: ListPayslipDto,
  ) {
    return this.payrollService.listPayslips(userId, query, role);
  }

  @Get('payslips/:id')
  async getPayslipDetail(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payrollService.getPayslipDetail(userId, id, role);
  }

  @Post('generate')
  @Roles('hrd', 'admin', 'super_admin')
  async generatePayslip(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: GeneratePayslipDto,
  ) {
    return this.payrollService.generatePayslip(userId, dto, role);
  }

  @Post('generate-batch')
  @Roles('hrd', 'admin', 'super_admin')
  async generateBatchPayslip(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: GenerateBatchPayslipDto,
  ) {
    return this.payrollService.generateBatchPayslip(userId, dto, role);
  }

  @Post('publish')
  @Roles('hrd', 'admin', 'super_admin')
  async publishPayslip(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: PublishPayslipDto,
  ) {
    return this.payrollService.publishPayslip(userId, dto.payslip_id, role);
  }

  @Get('periods')
  async listPayrollPeriods(@CurrentUser('companyId') companyId?: string) {
    return this.payrollService.listPayrollPeriods(companyId);
  }

  @Post('periods')
  @Roles('hrd', 'admin', 'super_admin')
  async createPayrollPeriod(
    @CurrentUser('role') role: string,
    @Body() dto: CreatePayrollPeriodDto,
  ) {
    return this.payrollService.createPeriod(dto, role);
  }

  @Patch('periods/:id')
  @Roles('hrd', 'admin', 'super_admin')
  async updatePayrollPeriod(
    @CurrentUser('role') role: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayrollPeriodDto,
  ) {
    return this.payrollService.updatePeriod(id, dto, role);
  }

  @Get('thr')
  async listTHR(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.payrollService.listTHR(userId, role);
  }

  @Post('thr/generate')
  @Roles('hrd', 'admin', 'super_admin')
  async generateTHR(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: GenerateTHRDto,
  ) {
    return this.payrollService.generateTHR(userId, dto, role);
  }
}
