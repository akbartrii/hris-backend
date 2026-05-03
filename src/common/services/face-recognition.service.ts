import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as faceapi from '@vladmandic/face-api';
import { Canvas, Image, ImageData } from 'canvas';
import * as path from 'path';

@Injectable()
export class FaceRecognitionService implements OnModuleInit {
  private readonly logger = new Logger(FaceRecognitionService.name);
  private isLoaded = false;

  async onModuleInit() {
    await this.loadModels();
  }

  private async loadModels() {
    try {
      this.logger.log('Loading face recognition models...');
      
      // Patch environment for Node.js
      // @ts-ignore
      faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

      const modelPath = path.join(process.cwd(), 'assets/models');
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
      ]);

      this.isLoaded = true;
      this.logger.log('Face recognition models loaded successfully');
    } catch (error) {
      this.logger.error(`Failed to load face models: ${error.message}`);
    }
  }

  async getFaceDescriptor(imageBuffer: Buffer): Promise<number[] | null> {
    if (!this.isLoaded) await this.loadModels();

    try {
      const img = await (faceapi.env.monkeyPatch as any).Image.loadFromBuffer(imageBuffer);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      return Array.from(detection.descriptor);
    } catch (error) {
      this.logger.error(`Face detection error: ${error.message}`);
      return null;
    }
  }

  compareFaces(descriptor1: number[], descriptor2: number[]): number {
    const dist = faceapi.euclideanDistance(descriptor1, descriptor2);
    return dist;
  }

  isMatch(descriptor1: number[], descriptor2: number[], threshold = 0.6): boolean {
    const distance = this.compareFaces(descriptor1, descriptor2);
    return distance < threshold;
  }
}
