import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      const user = await this.prisma.tr_users.findUnique({
        where: { email },
        include: { ms_roles: true, tr_employees: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new InternalServerErrorException('JWT_SECRET not configured');
      }
      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.ms_roles?.name || 'karyawan',
        },
        jwtSecret,
        { expiresIn: '7d' },
      );

      // Update last login
      await this.prisma.tr_users.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      });

      return {
        access_token: token,
        employee_id: user.tr_employees?.id || null,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.ms_roles?.name || 'karyawan',
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login failed for ${loginDto.email}:`, error);
      throw new InternalServerErrorException(
        'Authentication service temporarily unavailable',
      );
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { ms_roles: true, tr_employees: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      role: user.ms_roles?.name || 'karyawan',
      employee_id: user.tr_employees?.id || null,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
    };
  }
}
