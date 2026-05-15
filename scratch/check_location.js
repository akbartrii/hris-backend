
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const locationId = 'c138d43d-0428-4f81-992a-e27863d08593';
  console.log(`Checking ms_locations for ID: ${locationId}`);
  const location = await prisma.ms_locations.findUnique({
    where: { id: locationId },
  });
  console.log('Location in DB:');
  console.log(JSON.stringify(location, null, 2));
}

main()
  .catch((e) => {
    console.error('ERROR during query:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
