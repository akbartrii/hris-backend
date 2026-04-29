import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ParameterModule } from '../parameter/parameter.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PdfService } from '../../common/services/pdf.service';

@Module({
  imports: [PrismaModule, ParameterModule],
  controllers: [PayrollController],
  providers: [PayrollService, PdfService],
})
export class PayrollModule {}
