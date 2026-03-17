const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getHistory = async (req, res) => {
  try {
    const where = req.user.role === 'parent'
      ? { parentId: req.user.id }
      : req.user.role === 'teacher'
        ? { teacherId: req.user.id }
        : {};

    const history = await prisma.pickupHistory.findMany({
      where,
      include: {
        student: true,
        parent: { select: { id: true, name: true, phone: true } },
        teacher: { select: { id: true, name: true } }
      },
      orderBy: { pickupTime: 'desc' },
      take: 100
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

const getStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    const history = await prisma.pickupHistory.findMany({
      where: { studentId: parseInt(studentId) },
      include: {
        student: true,
        parent: { select: { id: true, name: true, phone: true } },
        teacher: { select: { id: true, name: true } }
      },
      orderBy: { pickupTime: 'desc' }
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student history' });
  }
};

module.exports = { getHistory, getStudentHistory };
