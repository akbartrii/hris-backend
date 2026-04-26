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
import { EmployeeService } from './employee.service';
import { ListEmployeeDto } from './dto/list-employee.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Employee')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Roles('hrd', 'admin', 'super_admin')
  async createEmployee(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeeService.createEmployee(userId, role, dto);
  }

  @Get()
  @Roles('hrd', 'admin', 'super_admin')
  async listEmployees(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: ListEmployeeDto,
  ) {
    return this.employeeService.listEmployees(userId, role, query);
  }

  @Get(':id')
  async getEmployeeDetail(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeeService.getEmployeeDetail(userId, role, id);
  }

  @Patch(':id')
  @Roles('hrd', 'admin', 'super_admin')
  async updateEmployee(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.updateEmployee(userId, role, id, dto);
  }

  @Get(':id/schedules')
  async getEmployeeSchedules(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeeService.getEmployeeSchedules(userId, role, id);
  }
}
