import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRaw`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'tr_reimbursements' 
    ORDER BY ordinal_position
  `;
  console.log('Kolom di tr_reimbursements:');
  console.log(columns);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
