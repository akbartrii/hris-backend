import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ListOvernightDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;
}
