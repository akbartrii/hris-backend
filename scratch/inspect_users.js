
const { Prisma } = require('@prisma/client');

async function main() {
  const dmmf = Prisma.dmmf;
  const model = dmmf.datamodel.models.find(m => m.name === 'ms_users');
  console.log('Relations in ms_users:');
  model.fields
    .filter(f => f.kind === 'object')
    .forEach(f => console.log(`- ${f.name} (type: ${f.type})`));
}

main().catch(console.error);
