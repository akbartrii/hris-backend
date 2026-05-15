
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'ahmad.spv@samugara.co.id';
  const password = 'password123';

  console.log(`Attempting to simulate login for: ${email}`);
  
  try {
    const user = await prisma.ms_users.findUnique({
      where: { email },
      include: { ms_roles: true, ms_employees: true },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.email);
    console.log('Role:', user.ms_roles?.name);
    console.log('Employee ID:', user.ms_employees?.id);

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isPasswordValid);

    if (user.ms_employees?.id) {
      console.log('Building assigned locations...');
      const employeeId = user.ms_employees.id;
      
      const employee = await prisma.ms_employees.findUnique({
        where: { id: employeeId },
        include: { ms_locations: true },
      });
      
      console.log('Employee locations loaded');
      console.log('Location name:', employee.ms_locations?.name);
    }
  } catch (error) {
    console.error('ERROR during simulation:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
