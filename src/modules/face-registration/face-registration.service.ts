import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';
import { FaceRecognitionService } from '../../common/services/face-recognition.service';

@Injectable()
export class FaceRegistrationService {
  private readonly STORAGE_BUCKET = 'face-registrations';

  constructor(
    private prisma: PrismaService,
    private storageService: SupabaseStorageService,
    private faceRecognitionService: FaceRecognitionService,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });

    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const registration = await this.prisma.tr_face_registrations.findUnique({
      where: { employee_id: user.tr_employees.id },
    });

    return {
      status: user.tr_employees.face_registration_status || 'not_registered',
      registered_at: registration?.registered_at || null,
      photos: registration
        ? {
            front: registration.front_photo_url,
            smile: registration.smile_photo_url,
            right: registration.right_photo_url,
            left: registration.left_photo_url,
          }
        : null,
    };
  }

  async register(
    userId: string,
    files: {
      front_photo: Express.Multer.File;
      smile_photo: Express.Multer.File;
      right_photo: Express.Multer.File;
      left_photo: Express.Multer.File;
    },
  ) {
    const user = await this.prisma.tr_users.findUnique({
      where: { id: userId },
      include: { tr_employees: true },
    });

    if (!user || !user.tr_employees) {
      throw new NotFoundException('Employee not found');
    }

    const employeeId = user.tr_employees.id;
    const timestamp = Date.now();

    const uploadPhoto = async (file: Express.Multer.File, pose: string) => {
      const ext = file.mimetype.split('/')[1] || 'jpg';
      const path = `${employeeId}/face_${timestamp}_${pose}.${ext}`;
      return this.storageService.uploadFile(
        this.STORAGE_BUCKET,
        path,
        file.buffer,
        file.mimetype,
      );
    };

    const [frontUrl, smileUrl, rightUrl, leftUrl] = await Promise.all([
      uploadPhoto(files.front_photo, 'front'),
      uploadPhoto(files.smile_photo, 'smile'),
      uploadPhoto(files.right_photo, 'right'),
      uploadPhoto(files.left_photo, 'left'),
    ]);

    // Extract face descriptor from front photo for later verification
    const descriptor = await this.faceRecognitionService.getFaceDescriptor(
      files.front_photo.buffer,
    );

    if (!descriptor) {
      throw new BadRequestException(
        'Could not detect face in front photo. Please ensure your face is clearly visible.',
      );
    }

    await this.prisma.tr_face_registrations.upsert({
      where: { employee_id: employeeId },
      update: {
        front_photo_url: frontUrl,
        smile_photo_url: smileUrl,
        right_photo_url: rightUrl,
        left_photo_url: leftUrl,
        face_descriptor: descriptor as any,
        updated_at: new Date(),
      },
      create: {
        employee_id: employeeId,
        front_photo_url: frontUrl,
        smile_photo_url: smileUrl,
        right_photo_url: rightUrl,
        left_photo_url: leftUrl,
        face_descriptor: descriptor as any,
      },
    });

    await this.prisma.tr_employees.update({
      where: { id: employeeId },
      data: { face_registration_status: 'registered' },
    });

    return {
      message: 'Face registration successful',
      status: 'registered',
    };
  }
}
