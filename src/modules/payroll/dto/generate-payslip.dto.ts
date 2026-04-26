import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratePayslipDto {
  @ApiProperty({ description: 'Payroll period UUID' })
  @IsUUID()
  @IsNotEmpty()
  payroll_period_id: string;

  @ApiPropertyOptional({
    description:
      'Specific employee UUID (admin only). Defaults to current user.',
  })
  @IsUUID()
  @IsOptional()
  employee_id?: string;
}

export class ListPayslipDto {
  @ApiPropertyOptional({ description: 'Filter by payroll period UUID' })
  @IsUUID()
  @IsOptional()
  payroll_period_id?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

export class PublishPayslipDto {
  @ApiProperty({ description: 'Payslip UUID' })
  @IsUUID()
  @IsNotEmpty()
  payslip_id: string;
}
