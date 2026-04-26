import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOvertimeMealAllowanceDto {
  @ApiProperty({ description: 'Day type (weekday, weekend, holiday)' })
  @IsString()
  @IsNotEmpty()
  day_type: string;

  @ApiProperty({ description: 'Start time (HH:mm:ss)' })
  @IsString()
  @IsNotEmpty()
  time_start: string;

  @ApiProperty({ description: 'End time (HH:mm:ss)' })
  @IsString()
  @IsNotEmpty()
  time_end: string;

  @ApiProperty({ description: 'Allowance amount' })
  @IsString()
  @IsNotEmpty()
  amount: string;
}
