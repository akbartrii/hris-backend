
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'ahmad.spv@samugara.co.id';

  console.log(`Verifying eager loading optimization for: ${email}`);
  
  try {
    // This simulates the new query in login
    const start = Date.now();
    const user = await prisma.ms_users.findUnique({
      where: { email },
      include: {
        ms_roles: true,
        ms_employees: {
          include: {
            ms_locations: true,
            tr_remote_work_requests_current_remote_work: true,
          },
        },
      },
    });
    const end = Date.now();

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Single eager-loaded query took ${end - start}ms`);
    console.log('User:', user.email);
    console.log('Employee ID:', user.ms_employees?.id);
    console.log('Location name:', user.ms_employees?.ms_locations?.name);
    console.log('WFH status:', user.ms_employees?.tr_remote_work_requests_current_remote_work?.status);
    
    // Now verify we have all data needed for buildAssignedLocations
    const locations = [];
    const emp = user.ms_employees;
    if (emp) {
      if (emp.ms_locations) {
        locations.push(emp.ms_locations.name);
      }
      if (emp.tr_remote_work_requests_current_remote_work) {
        locations.push(`WFH: ${emp.tr_remote_work_requests_current_remote_work.address}`);
      }
    }
    console.log('Assigned Locations:', locations);

  } catch (error) {
    console.error('ERROR during verification:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
