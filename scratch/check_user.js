
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.ms_users.findUnique({
    where: { email: 'ahmad.spv@samugara.co.id' },
    include: { ms_roles: true, ms_employees: true },
  });
  console.log('User in DB:');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
