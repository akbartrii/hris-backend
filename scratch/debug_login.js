
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'ahmad.spv@samugara.co.id';
  const password = 'password123';

  try {
    console.log('Step 1: findUnique user');
    const user = await prisma.ms_users.findUnique({
      where: { email },
      include: { ms_roles: true, ms_employees: true },
    });
    console.log('User:', !!user);

    console.log('Step 2: bcrypt compare');
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isValid);

    console.log('Step 3: Update last login');
    await prisma.ms_users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    console.log('Step 4: buildAssignedLocations');
    const employeeId = user.ms_employees?.id;
    if (employeeId) {
      console.log('Step 4.1: findUnique employee');
      const employee = await prisma.ms_employees.findUnique({
        where: { id: employeeId },
        include: { ms_locations: true },
      });
      console.log('Employee:', !!employee);

      if (employee.current_remote_work_id) {
        console.log('Step 4.2: findUnique WFH');
        const wfh = await prisma.tr_remote_work_requests.findUnique({
          where: { id: employee.current_remote_work_id },
        });
        console.log('WFH:', !!wfh);
      }
    }
    console.log('All steps completed successfully');
  } catch (error) {
    console.error('FAILED at step:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
