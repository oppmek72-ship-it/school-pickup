require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 ກຳລັງ seed ຂໍ້ມູນ...');

  await prisma.notification.deleteMany();
  await prisma.pickupHistory.deleteMany();
  await prisma.pickupRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.classroom.deleteMany();

  const hash = await bcrypt.hash('123456', 10);

  // ===========================
  // ຫ້ອງຮຽນ
  // ===========================
  const p11 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.1/1', gradeLevel: 'ປ.1', classCode: 'P1-1', teacherName: 'ຄູ ມະນີ' } });
  const p12 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.1/2', gradeLevel: 'ປ.1', classCode: 'P1-2', teacherName: 'ຄູ ສີດາ' } });
  const p21 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.2/1', gradeLevel: 'ປ.2', classCode: 'P2-1', teacherName: 'ຄູ ວັນນາ' } });
  const p31 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.3/1', gradeLevel: 'ປ.3', classCode: 'P3-1', teacherName: 'ຄູ ສົມພອນ' } });
  const p41 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.4/1', gradeLevel: 'ປ.4', classCode: 'P4-1', teacherName: 'ຄູ ຫຼ້າ' } });
  const p51 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.5/1', gradeLevel: 'ປ.5', classCode: 'P5-1', teacherName: 'ຄູ ພອນ' } });
  const m11 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ມ.1/1', gradeLevel: 'ມ.1', classCode: 'M1-1', teacherName: 'ຄູ ບຸນມາ' } });
  const m21 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ມ.2/1', gradeLevel: 'ມ.2', classCode: 'M2-1', teacherName: 'ຄູ ທອງຄຳ' } });
  const m31 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ມ.3/1', gradeLevel: 'ມ.3', classCode: 'M3-1', teacherName: 'ຄູ ສົມສັກ' } });

  // ===========================
  // Users
  // ===========================
  await prisma.user.create({ data: { name: 'ແອັດມິນ', username: 'admin', role: 'admin', password: hash } });

  // Teachers
  await prisma.user.create({ data: { name: 'ຄູ ມະນີ', username: 'P1-1', phone: '02010000001', role: 'teacher', password: hash, classroomId: p11.id } });
  await prisma.user.create({ data: { name: 'ຄູ ສີດາ', username: 'P1-2', phone: '02010000002', role: 'teacher', password: hash, classroomId: p12.id } });
  await prisma.user.create({ data: { name: 'ຄູ ວັນນາ', username: 'P2-1', phone: '02010000003', role: 'teacher', password: hash, classroomId: p21.id } });
  await prisma.user.create({ data: { name: 'ຄູ ສົມພອນ', username: 'P3-1', phone: '02010000004', role: 'teacher', password: hash, classroomId: p31.id } });
  await prisma.user.create({ data: { name: 'ຄູ ຫຼ້າ', username: 'P4-1', phone: '02010000005', role: 'teacher', password: hash, classroomId: p41.id } });
  await prisma.user.create({ data: { name: 'ຄູ ພອນ', username: 'P5-1', phone: '02010000006', role: 'teacher', password: hash, classroomId: p51.id } });
  await prisma.user.create({ data: { name: 'ຄູ ບຸນມາ', username: 'M1-1', phone: '02010000007', role: 'teacher', password: hash, classroomId: m11.id } });
  await prisma.user.create({ data: { name: 'ຄູ ທອງຄຳ', username: 'M2-1', phone: '02010000008', role: 'teacher', password: hash, classroomId: m21.id } });
  await prisma.user.create({ data: { name: 'ຄູ ສົມສັກ', username: 'M3-1', phone: '02010000009', role: 'teacher', password: hash, classroomId: m31.id } });

  // ===========================
  // ນັກຮຽນ — ຈັດຕາມຄອບຄົວ (parentPhone ດຽວກັນ = ອ້າຍເອື້ອຍນ້ອງ)
  // ===========================
  await prisma.student.createMany({
    data: [
      // ─── ຄອບຄົວ 1: ທ້າວ ສຸກສະຫວັນ — ມີ 3 ລູກ (ປ.1, ປ.3, ມ.1) ───
      { studentCode: 'STD-0001', firstName: 'ສົມສະໄໝ', lastName: 'ແກ້ວພິລາ', nickname: 'ນ້ອງໃໝ', classroomId: p31.id, parentName: 'ທ້າວ ສຸກສະຫວັນ', parentPhone: '02044444444' },
      { studentCode: 'STD-0002', firstName: 'ວິໄລ', lastName: 'ແກ້ວພິລາ', nickname: 'ນ້ອງຄຳ', classroomId: p11.id, parentName: 'ທ້າວ ສຸກສະຫວັນ', parentPhone: '02044444444' },
      { studentCode: 'STD-0003', firstName: 'ບຸນປ້ອ', lastName: 'ແກ້ວພິລາ', nickname: 'ນ້ອງປ້ອ', classroomId: m11.id, parentName: 'ທ້າວ ສຸກສະຫວັນ', parentPhone: '02044444444' },

      // ─── ຄອບຄົວ 2: ນາງ ບົວພາ — ມີ 4 ລູກ (ປ.1/2, ປ.2, ປ.4, ມ.2) ───
      { studentCode: 'STD-0004', firstName: 'ເດືອນ', lastName: 'ພິມມະສານ', nickname: 'ນ້ອງເດືອນ', classroomId: p12.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
      { studentCode: 'STD-0005', firstName: 'ດາລາ', lastName: 'ພິມມະສານ', nickname: 'ນ້ອງດາ', classroomId: p21.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
      { studentCode: 'STD-0006', firstName: 'ບຸນທອງ', lastName: 'ພິມມະສານ', nickname: 'ນ້ອງທອງ', classroomId: p41.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
      { studentCode: 'STD-0007', firstName: 'ສຸພາ', lastName: 'ພິມມະສານ', nickname: 'ນ້ອງສຸ', classroomId: m21.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },

      // ─── ຄອບຄົວ 3: ທ້າວ ພູທອນ — ມີ 2 ລູກ (ປ.3, ມ.2) ───
      { studentCode: 'STD-0008', firstName: 'ແກ້ວມະນີ', lastName: 'ຈັນທະລາ', nickname: 'ນ້ອງແກ້ວ', classroomId: p31.id, parentName: 'ທ້າວ ພູທອນ', parentPhone: '02066666666' },
      { studentCode: 'STD-0009', firstName: 'ວັນນາ', lastName: 'ຈັນທະລາ', nickname: 'ນ້ອງວັນ', classroomId: m21.id, parentName: 'ທ້າວ ພູທອນ', parentPhone: '02066666666' },

      // ─── ຄອບຄົວ 4: ນາງ ມະນີວັນ — ມີ 3 ລູກ (ປ.2, ປ.5, ມ.3) ───
      { studentCode: 'STD-0010', firstName: 'ນິນ', lastName: 'ສີສະຫວາດ', nickname: 'ນ້ອງນິນ', classroomId: p21.id, parentName: 'ນາງ ມະນີວັນ', parentPhone: '02077777777' },
      { studentCode: 'STD-0011', firstName: 'ໂຊ', lastName: 'ສີສະຫວາດ', nickname: 'ນ້ອງໂຊ', classroomId: p51.id, parentName: 'ນາງ ມະນີວັນ', parentPhone: '02077777777' },
      { studentCode: 'STD-0012', firstName: 'ພິມ', lastName: 'ສີສະຫວາດ', nickname: 'ນ້ອງພິມ', classroomId: m31.id, parentName: 'ນາງ ມະນີວັນ', parentPhone: '02077777777' },

      // ─── ຄອບຄົວ 5: ທ້າວ ໄຊຍະສິດ — ມີ 2 ລູກ (ປ.1, ປ.4) ───
      { studentCode: 'STD-0013', firstName: 'ແສງ', lastName: 'ໄຊຍະພອນ', nickname: 'ນ້ອງແສງ', classroomId: p11.id, parentName: 'ທ້າວ ໄຊຍະສິດ', parentPhone: '02088888888' },
      { studentCode: 'STD-0014', firstName: 'ຈັນ', lastName: 'ໄຊຍະພອນ', nickname: 'ນ້ອງຈັນ', classroomId: p41.id, parentName: 'ທ້າວ ໄຊຍະສິດ', parentPhone: '02088888888' },

      // ─── ຄອບຄົວ 6: ນາງ ພອນສະຫວັນ — ລູກຄົນດຽວ (ມ.1) ───
      { studentCode: 'STD-0015', firstName: 'ດາວ', lastName: 'ພົມມະຈັນ', nickname: 'ນ້ອງດາວ', classroomId: m11.id, parentName: 'ນາງ ພອນສະຫວັນ', parentPhone: '02099999999' },
    ]
  });

  console.log('✅ Seed ສຳເລັດ!');
  console.log('');
  console.log('📋 ຂໍ້ມູນຄອບຄົວ:');
  console.log('  ຄອບຄົວ 1: ທ້າວ ສຸກສະຫວັນ   → 3 ລູກ (STD-0001, 0002, 0003)');
  console.log('  ຄອບຄົວ 2: ນາງ ບົວພາ         → 4 ລູກ (STD-0004, 0005, 0006, 0007)');
  console.log('  ຄອບຄົວ 3: ທ້າວ ພູທອນ        → 2 ລູກ (STD-0008, 0009)');
  console.log('  ຄອບຄົວ 4: ນາງ ມະນີວັນ       → 3 ລູກ (STD-0010, 0011, 0012)');
  console.log('  ຄອບຄົວ 5: ທ້າວ ໄຊຍະສິດ     → 2 ລູກ (STD-0013, 0014)');
  console.log('  ຄອບຄົວ 6: ນາງ ພອນສະຫວັນ    → 1 ລູກ (STD-0015)');
  console.log('');
  console.log('🔑 Login:');
  console.log('  Admin:     username=admin    password=123456');
  console.log('  ຄູ:        username=P3-1 ຫຼື M1-1 ...  password=123456');
  console.log('  ຜູ້ປົກຄອງ: ໃສ່ STD-0001 ຫາ STD-0015 (ບໍ່ຕ້ອງລະຫັດ)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
