import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCorrectionDto {
  @ApiProperty({ description: 'Attendance ID to correct' })
  @IsUUID()
  attendance_id: string;

  @ApiProperty({
    description: 'Correction type',
    enum: ['clock_in', 'clock_out', 'both'],
  })
  @IsString()
  correction_type: string;

  @ApiPropertyOptional({ description: 'Corrected clock in time (HH:mm)' })
  @IsOptional()
  @IsString()
  correct_clock_in?: string;

  @ApiPropertyOptional({ description: 'Corrected clock out time (HH:mm)' })
  @IsOptional()
  @IsString()
  correct_clock_out?: string;

  @ApiProperty({ description: 'Reason for correction' })
  @IsString()
  @MaxLength(1000)
  reason: string;
}
