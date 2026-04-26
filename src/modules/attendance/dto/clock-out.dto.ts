import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClockOutDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  @Type(() => Number)
  lng: number;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
