
const bcrypt = require('bcryptjs');

async function main() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Testing bcrypt.compare performance...');
  const start = Date.now();
  await bcrypt.compare(password, hash);
  const end = Date.now();
  
  console.log(`bcrypt.compare took ${end - start}ms`);
}

main();
