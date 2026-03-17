const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getStudents = async (req, res) => {
  try {
    const where = req.user.role === 'parent'
      ? { parentId: req.user.id }
      : req.user.role === 'teacher'
        ? { teacherId: req.user.id }
        : {};

    const students = await prisma.student.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, phone: true } },
        teacher: { select: { id: true, name: true } },
        pickupRequests: {
          where: { status: { in: ['coming', 'arrived'] } },
          orderBy: { requestTime: 'desc' },
          take: 1
        }
      }
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

const getStudent = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        parent: { select: { id: true, name: true, phone: true } },
        teacher: { select: { id: true, name: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

module.exports = { getStudents, getStudent };
