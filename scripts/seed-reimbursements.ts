import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ambil data employee yang sudah ada
  const employees = await prisma.ms_employees.findMany({
    take: 5,
    select: {
      id: true,
      supervisor_id: true,
      full_name: true,
    },
  });

  if (employees.length === 0) {
    console.error(
      'Tidak ada data employee di database. Seed ms_employees terlebih dahulu.',
    );
    process.exit(1);
  }

  console.log(`Ditemukan ${employees.length} employee existing:`);
  employees.forEach((e) =>
    console.log(` - ${e.id} | ${e.full_name} | supervisor: ${e.supervisor_id}`),
  );

  // Ambil semua employee id untuk dipakai sebagai hr_approved_by
  const allEmployeeIds = employees.map((e) => e.id);
  const hrApproverId = allEmployeeIds[allEmployeeIds.length - 1]; // pakai employee terakhir sebagai HR approver

  const dummyData = [];

  // Untuk setiap employee, buat 1-2 reimbursements
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const supervisorId =
      emp.supervisor_id || allEmployeeIds[(i + 1) % allEmployeeIds.length];

    // Reimbursement 1: pending
    dummyData.push({
      employee_id: emp.id,
      date: new Date(`2026-04-${10 + i * 2}`),
      category: [
        'Transportasi',
        'Makanan',
        'Parkir',
        'Bensin',
        'Hotel',
        'Perjalanan Dinas',
      ][i % 6],
      amount: 50000 + i * 25000,
      description: `Dummy reimbursement ${i + 1}a untuk testing`,
      status: 'pending',
      supervisor_id: supervisorId,
    });

    // Reimbursement 2: supervisor_approved
    dummyData.push({
      employee_id: emp.id,
      date: new Date(`2026-04-${11 + i * 2}`),
      category: [
        'Transportasi',
        'Makanan',
        'Parkir',
        'Bensin',
        'Hotel',
        'Perjalanan Dinas',
      ][(i + 2) % 6],
      amount: 100000 + i * 50000,
      description: `Dummy reimbursement ${i + 1}b untuk testing`,
      status: 'supervisor_approved',
      supervisor_id: supervisorId,
      supervisor_approved_at: new Date(),
    });
  }

  // Tambahkan 1 record approved dan 1 rejected
  if (employees.length > 0) {
    const firstEmp = employees[0];
    dummyData.push({
      employee_id: firstEmp.id,
      date: new Date('2026-04-01'),
      category: 'Bensin',
      amount: 200000,
      description: 'Dummy approved reimbursement',
      status: 'approved',
      supervisor_id: firstEmp.supervisor_id || allEmployeeIds[1],
      supervisor_approved_at: new Date('2026-04-02T08:00:00Z'),
      hr_approved_by: hrApproverId,
      approved_at: new Date('2026-04-03T09:00:00Z'),
    });

    dummyData.push({
      employee_id: firstEmp.id,
      date: new Date('2026-04-03'),
      category: 'Hotel',
      amount: 750000,
      description: 'Dummy rejected reimbursement',
      status: 'rejected',
      supervisor_id: firstEmp.supervisor_id || allEmployeeIds[1],
      rejection_reason: 'Melebihi batas limit harian',
    });
  }

  console.log(`\nMemasukkan ${dummyData.length} dummy reimbursements...`);

  for (const data of dummyData) {
    try {
      const created = await prisma.tr_reimbursements.create({ data });
      console.log(
        `✅ Created reimbursement ${created.id} | status: ${created.status} | amount: ${created.amount}`,
      );
    } catch (err) {
      console.error(`❌ Gagal insert reimbursement:`, err.message);
    }
  }

  console.log('\n✅ Selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
