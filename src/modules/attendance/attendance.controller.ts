import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { ApproveCorrectionDto } from './dto/approve-correction.dto';
import { ListAttendanceDto } from './dto/list-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BadRequestException } from '@nestjs/common';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Clock in with GPS and photo', type: ClockInDto })
  async clockIn(
    @CurrentUser('userId') userId: string,
    @Body() dto: ClockInDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    if (!photo) {
      throw new BadRequestException('Photo is required');
    }
    return this.attendanceService.clockIn(userId, dto, photo);
  }

  @Post('clock-out')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Clock out with GPS and photo', type: ClockOutDto })
  async clockOut(
    @CurrentUser('userId') userId: string,
    @Body() dto: ClockOutDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    if (!photo) {
      throw new BadRequestException('Photo is required');
    }
    return this.attendanceService.clockOut(userId, dto, photo);
  }

  @Get('history')
  async listAttendance(
    @CurrentUser('userId') userId: string,
    @Query() query: ListAttendanceDto,
  ) {
    return this.attendanceService.listAttendance(userId, query);
  }

  @Get('all')
  @Roles('hrd', 'admin', 'manager_hrga', 'super_admin')
  async listAllAttendance(@Query() query: any) {
    return this.attendanceService.listAllAttendance(query);
  }

  @Post('corrections')
  async createCorrection(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCorrectionDto,
  ) {
    return this.attendanceService.createCorrection(userId, dto);
  }

  @Patch('corrections/:id/cancel')
  async cancelCorrection(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attendanceService.cancelCorrection(userId, id);
  }

  @Get('corrections')
  async listCorrections(
    @CurrentUser('userId') userId: string,
    @Query() query: any,
  ) {
    return this.attendanceService.listCorrections(userId, query);
  }

  @Patch('corrections/:id/approve')
  @Roles('atasan', 'manager_hrga', 'admin', 'super_admin')
  async approveCorrection(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveCorrectionDto,
  ) {
    return this.attendanceService.approveCorrection(userId, id, dto, role);
  }
}
