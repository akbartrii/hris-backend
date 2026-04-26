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
  async listPayrollPeriods() {
    return this.payrollService.listPayrollPeriods();
  }

  @Get('thr')
  async listTHR(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.payrollService.listTHR(userId, role);
  }
}
