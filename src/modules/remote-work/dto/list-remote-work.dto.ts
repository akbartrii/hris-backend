import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ListRemoteWorkDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by employee_id (admin only)' })
  @IsString()
  @IsOptional()
  employee_id?: string;
}
