
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'ms_users'
  `;
  console.log('Indexes on ms_users:');
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
