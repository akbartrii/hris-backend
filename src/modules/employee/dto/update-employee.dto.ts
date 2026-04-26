import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Full name' })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: ['male', 'female'] })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Birth date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @ApiPropertyOptional({
    description: 'Employment status',
    enum: ['permanent', 'contract', 'probation', 'internship'],
  })
  @IsString()
  @IsOptional()
  employment_status?: string;

  @ApiPropertyOptional({ description: 'Join date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  join_date?: string;

  @ApiPropertyOptional({ description: 'Contract end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  contract_end_date?: string;

  @ApiPropertyOptional({ description: 'Base salary' })
  @IsString()
  @IsOptional()
  base_salary?: string;

  @ApiPropertyOptional({ description: 'Fixed allowance' })
  @IsString()
  @IsOptional()
  fixed_allowance?: string;

  @ApiPropertyOptional({ description: 'Phone allowance' })
  @IsString()
  @IsOptional()
  phone_allowance?: string;

  @ApiPropertyOptional({ description: 'Dinas allowance' })
  @IsString()
  @IsOptional()
  dinas_allowance?: string;

  @ApiPropertyOptional({
    description: 'Shift type',
    enum: ['normal', 'shift_1', 'shift_2', 'shift_3'],
  })
  @IsString()
  @IsOptional()
  shift_type?: string;

  @ApiPropertyOptional({ description: 'Is security' })
  @IsBoolean()
  @IsOptional()
  is_security?: boolean;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
