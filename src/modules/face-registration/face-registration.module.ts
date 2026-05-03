import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FaceRegistrationController } from './face-registration.controller';
import { FaceRegistrationService } from './face-registration.service';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';
import { FaceRecognitionService } from '../../common/services/face-recognition.service';

@Module({
  imports: [PrismaModule],
  controllers: [FaceRegistrationController],
  providers: [
    FaceRegistrationService,
    SupabaseStorageService,
    FaceRecognitionService,
  ],
})
export class FaceRegistrationModule {}
