const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// All admin routes require auth + admin role
router.use(authMiddleware, roleMiddleware('admin'));

// ===== Users =====
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    include: { classroom: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users.map(u => { const { password: _, ...u2 } = u; return u2; }));
});

router.post('/users', async (req, res) => {
  try {
    const { name, username, phone, role, password, classroomId } = req.body;
    const hash = await bcrypt.hash(password || '123456', 10);
    const user = await prisma.user.create({
      data: { name, username: username || null, phone: phone || null, role, password: hash, classroomId: classroomId ? parseInt(classroomId) : null }
    });
    const { password: _, ...u } = user;
    res.json(u);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'ຊື່ຜູ້ໃຊ້ ຫຼື ເບີໂທຊ້ຳ' });
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, username, phone, role, classroomId, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { name, username: username || null, phone: phone || null, role, classroomId: classroomId ? parseInt(classroomId) : null, isActive }
    });
    const { password: _, ...u } = user;
    res.json(u);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { password: hash } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Classrooms =====
router.get('/classrooms', async (req, res) => {
  const classrooms = await prisma.classroom.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { className: 'asc' }
  });
  res.json(classrooms);
});

router.post('/classrooms', async (req, res) => {
  try {
    const { className, gradeLevel, classCode, teacherName } = req.body;
    const classroom = await prisma.classroom.create({ data: { className, gradeLevel, classCode, teacherName } });
    res.json(classroom);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'ລະຫັດຫ້ອງຊ້ຳ' });
    res.status(500).json({ error: error.message });
  }
});

router.put('/classrooms/:id', async (req, res) => {
  try {
    const { className, gradeLevel, classCode, teacherName, isActive } = req.body;
    const classroom = await prisma.classroom.update({
      where: { id: parseInt(req.params.id) },
      data: { className, gradeLevel, classCode, teacherName, isActive }
    });
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/classrooms/:id', async (req, res) => {
  try {
    await prisma.classroom.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Stats =====
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalStudents, totalUsers, todayPickups, activeQueue] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.pickupHistory.count({ where: { pickupTime: { gte: today } } }),
      prisma.pickupRequest.count({ where: { status: { in: ['waiting', 'announced'] } } })
    ]);
    res.json({ totalStudents, totalUsers, todayPickups, activeQueue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Pickup History =====
router.get('/history', async (req, res) => {
  try {
    const history = await prisma.pickupHistory.findMany({
      include: {
        student: { include: { classroom: true } },
        parent: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } }
      },
      orderBy: { pickupTime: 'desc' },
      take: 100
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Cancel any call (admin) =====
router.put('/pickup/:id/cancel', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    const r = await p.pickupRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'cancelled' }
    });
    const io = req.app.get('io');
    io.emit('call-cancelled', { callId: r.id, studentId: r.studentId });
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// Voice Recording — Upload
// ====================================
router.put('/students/:id/voice', async (req, res) => {
  try {
    const { voiceRecording } = req.body;
    if (!voiceRecording || !voiceRecording.startsWith('data:audio/')) {
      return res.status(400).json({ error: 'Invalid audio data' });
    }
    if (voiceRecording.length > 500000) {
      return res.status(400).json({ error: 'Audio too large (max ~10 seconds)' });
    }
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    await p.student.update({
      where: { id: parseInt(req.params.id) },
      data: { voiceRecording }
    });
    res.json({ success: true, message: 'ບັນທຶກສຽງສຳເລັດ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// Voice Recording — Delete
// ====================================
router.delete('/students/:id/voice', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    await p.student.update({
      where: { id: parseInt(req.params.id) },
      data: { voiceRecording: null }
    });
    res.json({ success: true, message: 'ລຶບສຽງສຳເລັດ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
