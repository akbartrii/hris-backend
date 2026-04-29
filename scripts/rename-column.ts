import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if hr_approved_at column exists
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tr_reimbursements' 
      AND column_name = 'hr_approved_at'
    `;

    if (Array.isArray(columns) && columns.length > 0) {
      console.log('Found hr_approved_at column. Renaming to approved_at...');

      // Rename column
      await prisma.$executeRaw`
        ALTER TABLE tr_reimbursements 
        RENAME COLUMN hr_approved_at TO approved_at
      `;

      console.log('✅ Column renamed successfully');
    } else {
      console.log(
        'hr_approved_at column not found. Checking for approved_at...',
      );

      const approvedAtColumns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tr_reimbursements' 
        AND column_name = 'approved_at'
      `;

      if (Array.isArray(approvedAtColumns) && approvedAtColumns.length > 0) {
        console.log('✅ approved_at column already exists');
      } else {
        console.log('⚠️ Neither hr_approved_at nor approved_at found');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
