
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'ms_employees'
  `;
  console.log('Indexes on ms_employees:');
  console.table(indexes);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
