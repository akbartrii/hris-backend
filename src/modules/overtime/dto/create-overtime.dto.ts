import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsIn,
  IsOptional,
} from 'class-validator';

export class CreateOvertimeDto {
  @ApiProperty({ description: 'Target employee UUID' })
  @IsUUID()
  @IsNotEmpty()
  employee_id: string;

  @ApiProperty({
    description: 'Overtime date (YYYY-MM-DD)',
    example: '2025-06-15',
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '18:00' })
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '22:00' })
  @IsString()
  @IsNotEmpty()
  end_time: string;

  @ApiProperty({
    description: 'Day type',
    enum: ['weekday', 'weekend', 'holiday'],
  })
  @IsString()
  @IsIn(['weekday', 'weekend', 'holiday'])
  day_type: string;

  @ApiProperty({ description: 'Description / reason for overtime' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
