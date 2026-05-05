import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';
import { FaceRecognitionService } from '../../common/services/face-recognition.service';
import { loadImage, createCanvas } from 'canvas';

@Injectable()
export class FaceRegistrationService {
  private readonly logger = new Logger(FaceRegistrationService.name);
  private readonly STORAGE_BUCKET = 'face-registrations';
  private readonly MAX_WIDTH = 640;

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

    // Step 1: Resize all photos first (faster upload + faster face detection)
    this.logger.log(
      `[FaceReg] Resizing 4 photos for employee ${employeeId}...`,
    );
    const resizeStart = Date.now();

    const [frontResized, smileResized, rightResized, leftResized] =
      await Promise.all([
        this.resizeImage(files.front_photo.buffer),
        this.resizeImage(files.smile_photo.buffer),
        this.resizeImage(files.right_photo.buffer),
        this.resizeImage(files.left_photo.buffer),
      ]);

    this.logger.log(`[FaceReg] Resizing done in ${Date.now() - resizeStart}ms`);

    // Step 2: Face detect front photo FIRST (fail fast - no upload if fail)
    this.logger.log(`[FaceReg] Face detecting front photo...`);
    const detectStart = Date.now();

    const descriptor =
      await this.faceRecognitionService.getFaceDescriptor(frontResized);

    this.logger.log(
      `[FaceReg] Face detection done in ${Date.now() - detectStart}ms`,
    );

    if (!descriptor) {
      throw new BadRequestException(
        'Could not detect face in front photo. Please ensure your face is clearly visible.',
      );
    }

    // Step 3: Upload resized photos (parallel)
    this.logger.log(`[FaceReg] Uploading 4 photos...`);
    const uploadStart = Date.now();

    const uploadPhoto = async (buffer: Buffer, pose: string) => {
      const path = `${employeeId}/${pose}.jpg`;
      return this.storageService.uploadFile(
        this.STORAGE_BUCKET,
        path,
        buffer,
        'image/jpeg',
      );
    };

    const [frontUrl, smileUrl, rightUrl, leftUrl] = await Promise.all([
      uploadPhoto(frontResized, 'front'),
      uploadPhoto(smileResized, 'smile'),
      uploadPhoto(rightResized, 'right'),
      uploadPhoto(leftResized, 'left'),
    ]);

    this.logger.log(`[FaceReg] Upload done in ${Date.now() - uploadStart}ms`);

    // Step 4: Save to DB
    this.logger.log(`[FaceReg] Saving to database...`);
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

    this.logger.log(
      `[FaceReg] Registration complete for employee ${employeeId}`,
    );

    return {
      message: 'Face registration successful',
      status: 'registered',
    };
  }

  private async resizeImage(buffer: Buffer): Promise<Buffer> {
    try {
      const img = await loadImage(buffer);

      // If image is already small, return as-is
      if (img.width <= this.MAX_WIDTH) {
        return buffer;
      }

      const ratio = this.MAX_WIDTH / img.width;
      const height = Math.round(img.height * ratio);

      const canvas = createCanvas(this.MAX_WIDTH, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, this.MAX_WIDTH, height);

      return canvas.toBuffer('image/jpeg', { quality: 0.85 });
    } catch (error) {
      this.logger.warn(
        `[FaceReg] Resize failed, using original: ${error.message}`,
      );
      return buffer;
    }
  }
}
