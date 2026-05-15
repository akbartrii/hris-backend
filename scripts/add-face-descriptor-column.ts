import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding face_descriptor column to ms_face_registrations...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ms_face_registrations" ADD COLUMN IF NOT EXISTS "face_descriptor" JSONB;`
    );
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
