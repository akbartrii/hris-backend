import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ParameterModule } from '../parameter/parameter.module';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';

@Module({
  imports: [PrismaModule, ParameterModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, SupabaseStorageService],
})
export class AttendanceModule {}
