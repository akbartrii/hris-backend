
const { Prisma } = require('@prisma/client');

async function main() {
  const dmmf = Prisma.dmmf;
  const employeeModel = dmmf.datamodel.models.find(m => m.name === 'ms_employees');
  console.log('Relations in ms_employees:');
  employeeModel.fields
    .filter(f => f.kind === 'object')
    .forEach(f => console.log(`- ${f.name} (type: ${f.type})`));
}

main().catch(console.error);
