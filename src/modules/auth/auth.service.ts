import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SaveFcmTokenDto } from './dto/save-fcm-token.dto';
import { RevokeFcmTokenDto } from './dto/revoke-fcm-token.dto';
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

  async saveFcmToken(userId: string, dto: SaveFcmTokenDto) {
    try {
      // Upsert device by fcm_token (unique)
      const device = await this.prisma.tr_user_devices.upsert({
        where: { fcm_token: dto.fcm_token },
        update: {
          user_id: userId,
          device_id: dto.device_id || null,
          platform: dto.platform || null,
          is_active: true,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          fcm_token: dto.fcm_token,
          device_id: dto.device_id || null,
          platform: dto.platform || null,
          is_active: true,
        },
      });

      // Also update legacy fcm_token on tr_users for backward compatibility
      await this.prisma.tr_users.update({
        where: { id: userId },
        data: { fcm_token: dto.fcm_token },
      });

      return {
        message: 'FCM token saved successfully',
        device_id: device.id,
      };
    } catch (error) {
      this.logger.error(`Failed to save FCM token for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to save FCM token');
    }
  }

  async revokeFcmToken(userId: string, dto: RevokeFcmTokenDto) {
    try {
      const device = await this.prisma.tr_user_devices.findFirst({
        where: {
          user_id: userId,
          fcm_token: dto.fcm_token,
        },
      });

      if (!device) {
        return { message: 'Token not found or already revoked' };
      }

      await this.prisma.tr_user_devices.update({
        where: { id: device.id },
        data: { is_active: false, updated_at: new Date() },
      });

      return { message: 'FCM token revoked successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to revoke FCM token for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to revoke FCM token');
    }
  }

  async revokeAllFcmTokens(userId: string) {
    try {
      const { count } = await this.prisma.tr_user_devices.updateMany({
        where: { user_id: userId, is_active: true },
        data: { is_active: false, updated_at: new Date() },
      });

      return {
        message: 'All FCM tokens revoked successfully',
        revoked_count: count,
      };
    } catch (error) {
      this.logger.error(
        `Failed to revoke all FCM tokens for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to revoke FCM tokens');
    }
  }
}
