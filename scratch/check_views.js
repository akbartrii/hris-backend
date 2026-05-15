
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const views = await prisma.$queryRaw`
    SELECT viewname 
    FROM pg_catalog.pg_views 
    WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
  `;
  console.log('Views in DB:');
  console.table(views);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
