
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wfhId = '83fcf2ca-a926-4703-afef-1412a4641b99';
  console.log(`Checking tr_remote_work_requests for ID: ${wfhId}`);
  const wfh = await prisma.tr_remote_work_requests.findUnique({
    where: { id: wfhId },
  });
  console.log('WFH request in DB:');
  console.log(JSON.stringify(wfh, null, 2));
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
