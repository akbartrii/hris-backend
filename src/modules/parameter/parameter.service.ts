import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ParameterService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ms_parameters.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findOne(key: string) {
    return this.prisma.ms_parameters.findUnique({
      where: { key },
    });
  }

  async getValue(key: string): Promise<string | null> {
    const param = await this.prisma.ms_parameters.findUnique({
      where: { key },
    });
    return param?.value ?? null;
  }

  async getNumber(key: string, defaultValue: number = 0): Promise<number> {
    const val = await this.getValue(key);
    return val ? Number(val) : defaultValue;
  }

  async create(key: string, value: string) {
    return this.prisma.ms_parameters.create({
      data: { key, value },
    });
  }

  async update(key: string, value: string) {
    return this.prisma.ms_parameters.update({
      where: { key },
      data: { value },
    });
  }

  async remove(key: string) {
    return this.prisma.ms_parameters.delete({
      where: { key },
    });
  }
}
