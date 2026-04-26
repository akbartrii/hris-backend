import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PdfService } from '../../common/services/pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [PayrollController],
  providers: [PayrollService, PdfService],
})
export class PayrollModule {}
