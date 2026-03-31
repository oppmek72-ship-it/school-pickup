const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ດຶງນັກຮຽນ — parent ເຫັນຕາມ parentPhone, teacher ເຫັນຕາມ classroom
const getStudents = async (req, res) => {
  try {
    let where = { isActive: true };

    if (req.user.role === 'parent') {
      // Parent login: ຄົ້ນຫາຈາກ parentPhone ໃນ student
      const studentCode = req.user.studentCode;
      if (studentCode) {
        // ດຶງ student ຄົນນີ້ + student ທີ່ມີ parentPhone ດຽວກັນ
        const baseStudent = await prisma.student.findUnique({ where: { studentCode } });
        if (baseStudent?.parentPhone) {
          where = { isActive: true, parentPhone: baseStudent.parentPhone };
        } else {
          where = { isActive: true, studentCode };
        }
      }
    } else if (req.user.role === 'teacher') {
      where = { isActive: true, classroomId: req.user.classroomId };
    }
    // admin sees all

    const students = await prisma.student.findMany({
      where,
      include: {
        classroom: true,
        pickupRequests: {
          where: { status: { in: ['waiting', 'announced'] } },
          orderBy: { calledAt: 'desc' },
          take: 1
        }
      },
      orderBy: { firstName: 'asc' }
    });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'ດຶງຂໍ້ມູນນັກຮຽນບໍ່ສຳເລັດ' });
  }
};

// ຄົ້ນຫານັກຮຽນ (ໃຊ້ໃນ parent search)
const searchStudents = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        OR: [
          { studentCode: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { nickname: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { classroom: true },
      take: 10
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'ຄົ້ນຫາບໍ່ສຳເລັດ' });
  }
};

const getStudent = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { classroom: true }
    });
    if (!student) return res.status(404).json({ error: 'ບໍ່ພົບນັກຮຽນ' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'ດຶງຂໍ້ມູນນັກຮຽນບໍ່ສຳເລັດ' });
  }
};

// Admin: ເພີ່ມນັກຮຽນ
const createStudent = async (req, res) => {
  try {
    const { studentCode, firstName, lastName, nickname, classroomId, parentName, parentPhone } = req.body;
    const student = await prisma.student.create({
      data: { studentCode, firstName, lastName, nickname, classroomId: classroomId ? parseInt(classroomId) : null, parentName, parentPhone },
      include: { classroom: true }
    });
    res.json(student);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'ລະຫັດນັກຮຽນນີ້ມີຢູ່ແລ້ວ' });
    res.status(500).json({ error: 'ເພີ່ມນັກຮຽນບໍ່ສຳເລັດ' });
  }
};

// Admin: ແກ້ໄຂນັກຮຽນ
const updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, nickname, classroomId, parentName, parentPhone, photo, isActive } = req.body;
    const student = await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: { firstName, lastName, nickname, classroomId: classroomId ? parseInt(classroomId) : null, parentName, parentPhone, photo, isActive },
      include: { classroom: true }
    });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'ແກ້ໄຂນັກຮຽນບໍ່ສຳເລັດ' });
  }
};

// Admin: ລົບ (soft delete)
const deleteStudent = async (req, res) => {
  try {
    await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'ລົບນັກຮຽນບໍ່ສຳເລັດ' });
  }
};

// Classrooms list
const getClassrooms = async (req, res) => {
  try {
    const classrooms = await prisma.classroom.findMany({
      where: { isActive: true },
      include: { _count: { select: { students: true } } },
      orderBy: { className: 'asc' }
    });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ error: 'ດຶງຫ້ອງຮຽນບໍ່ສຳເລັດ' });
  }
};

module.exports = { getStudents, searchStudents, getStudent, createStudent, updateStudent, deleteStudent, getClassrooms };
