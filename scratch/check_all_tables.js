
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dmmf = Prisma.dmmf;
  const models = dmmf.datamodel.models;
  
  const tablesInDb = await prisma.$queryRaw`
    SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
  `;
  const tableNames = tablesInDb.map(t => t.tablename);

  console.log('Comparing Prisma models with DB tables:');
  for (const model of models) {
    const tableName = model.dbName || model.name;
    if (!tableNames.includes(tableName)) {
      console.error(`MISSING TABLE: ${tableName} (Model: ${model.name})`);
    } else {
      // console.log(`OK: ${tableName}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
