import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class CreateWorkScheduleDto {
  @ApiProperty({ description: 'Schedule name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Shift code' })
  @IsString()
  @IsOptional()
  shift_code?: string;

  @ApiProperty({ description: 'Schedule type (normal, ramadhan, shift)' })
  @IsString()
  @IsNotEmpty()
  schedule_type: string;

  @ApiPropertyOptional({ description: 'Start time (HH:mm:ss)' })
  @IsString()
  @IsOptional()
  start_time?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm:ss)' })
  @IsString()
  @IsOptional()
  end_time?: string;

  @ApiPropertyOptional({ description: 'Break start time (HH:mm:ss)' })
  @IsString()
  @IsOptional()
  break_start?: string;

  @ApiPropertyOptional({ description: 'Break end time (HH:mm:ss)' })
  @IsString()
  @IsOptional()
  break_end?: string;

  @ApiPropertyOptional({
    description: 'Work days (1=Monday, 7=Sunday)',
    default: [1, 2, 3, 4, 5],
  })
  @IsArray()
  @IsOptional()
  work_days?: number[];

  @ApiPropertyOptional({ description: 'Is holiday off', default: true })
  @IsBoolean()
  @IsOptional()
  is_holiday_off?: boolean;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
