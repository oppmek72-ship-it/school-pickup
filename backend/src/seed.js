const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.pickupHistory.deleteMany();
  await prisma.pickupRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Create admin
  const admin = await prisma.user.create({
    data: {
      name: 'ທ່ານ ບຸນມີ',
      phone: '02099999999',
      role: 'admin',
      password: hashedPassword
    }
  });

  // Create teachers
  const teacher1 = await prisma.user.create({
    data: {
      name: 'ອາຈານ ສົມພອນ',
      phone: '02011111111',
      role: 'teacher',
      password: hashedPassword
    }
  });

  const teacher2 = await prisma.user.create({
    data: {
      name: 'ອາຈານ ວິໄລ',
      phone: '02022222222',
      role: 'teacher',
      password: hashedPassword
    }
  });

  // Create parents
  const parent1 = await prisma.user.create({
    data: {
      name: 'ທ້າວ ສຸກສະຫວັນ',
      phone: '02033333333',
      role: 'parent',
      password: hashedPassword
    }
  });

  const parent2 = await prisma.user.create({
    data: {
      name: 'ນາງ ບົວພາ',
      phone: '02044444444',
      role: 'parent',
      password: hashedPassword
    }
  });

  const parent3 = await prisma.user.create({
    data: {
      name: 'ທ້າວ ພູທອນ',
      phone: '02055555555',
      role: 'parent',
      password: hashedPassword
    }
  });

  // Create students
  await prisma.student.createMany({
    data: [
      { name: 'ນ້ອງ ອານັນ', class: 'P1', qrCode: 'STU001', parentId: parent1.id, teacherId: teacher1.id },
      { name: 'ນ້ອງ ສົມພອນ', class: 'P2', qrCode: 'STU002', parentId: parent1.id, teacherId: teacher1.id },
      { name: 'ນ້ອງ ພອນ', class: 'P1', qrCode: 'STU003', parentId: parent2.id, teacherId: teacher1.id },
      { name: 'ນ້ອງ ແກ້ວ', class: 'P3', qrCode: 'STU004', parentId: parent2.id, teacherId: teacher2.id },
      { name: 'ນ້ອງ ດາວ', class: 'P2', qrCode: 'STU005', parentId: parent3.id, teacherId: teacher2.id }
    ]
  });

  console.log('Seed data created successfully!');
  console.log('\nTest accounts (password: 123456):');
  console.log('Admin:    02099999999');
  console.log('Teacher1: 02011111111');
  console.log('Teacher2: 02022222222');
  console.log('Parent1:  02033333333');
  console.log('Parent2:  02044444444');
  console.log('Parent3:  02055555555');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
