require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const pickupRoutes = require('./routes/pickup.routes');
const notificationRoutes = require('./routes/notification.routes');
const historyRoutes = require('./routes/history.routes');
const adminRoutes = require('./routes/admin.routes');
const setupSocketEvents = require('./socket/events');
const { getQueueData } = require('./controllers/pickup.controller');

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }
});

app.use(cors());
app.use(express.json());

app.set('io', io);
app.set('prisma', prisma);

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ====================================
// Seed endpoint
// ====================================
app.post('/api/seed', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    await prisma.notification.deleteMany();
    await prisma.pickupHistory.deleteMany();
    await prisma.pickupRequest.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
    await prisma.classroom.deleteMany();

    const hash = await bcrypt.hash('123456', 10);

    const p11 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.1/1', gradeLevel: 'ປ.1', classCode: 'P1-1', teacherName: 'ຄູ ມະນີ' } });
    const p31 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.3/1', gradeLevel: 'ປ.3', classCode: 'P3-1', teacherName: 'ຄູ ສົມພອນ' } });
    const m11 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ມ.1/1', gradeLevel: 'ມ.1', classCode: 'M1-1', teacherName: 'ຄູ ບຸນມາ' } });

    await prisma.user.create({ data: { name: 'ແອັດມິນ', username: 'admin', role: 'admin', password: hash } });
    await prisma.user.create({ data: { name: 'ຄູ ສົມພອນ', username: 'P3-1', phone: '02011111111', role: 'teacher', password: hash, classroomId: p31.id } });
    await prisma.user.create({ data: { name: 'ຄູ ບຸນມາ', username: 'M1-1', phone: '02022222222', role: 'teacher', password: hash, classroomId: m11.id } });

    await prisma.student.createMany({
      data: [
        { studentCode: 'STD-0001', firstName: 'ສົມສະໄໝ', lastName: 'ແກ້ວພິລາ', nickname: 'ນ້ອງໃໝ', classroomId: p31.id, parentName: 'ທ້າວ ສຸກສະຫວັນ', parentPhone: '02044444444' },
        { studentCode: 'STD-0002', firstName: 'ວິໄລ', lastName: 'ສີສະຫວາດ', nickname: 'ນ້ອງຄຳ', classroomId: p31.id, parentName: 'ທ້າວ ສຸກສະຫວັນ', parentPhone: '02044444444' },
        { studentCode: 'STD-0003', firstName: 'ບຸນທອງ', lastName: 'ພົມມະວົງ', nickname: 'ນ້ອງທອງ', classroomId: m11.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
        { studentCode: 'STD-0004', firstName: 'ດາລາ', lastName: 'ສຸກສະຫວັນ', nickname: 'ນ້ອງດາ', classroomId: p11.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
        { studentCode: 'STD-0005', firstName: 'ແກ້ວມະນີ', lastName: 'ຈັນທະລາ', nickname: 'ນ້ອງແກ້ວ', classroomId: p31.id, parentName: 'ທ້າວ ພູທອນ', parentPhone: '02066666666' },
      ]
    });

    res.json({ success: true, message: 'Seed complete! Password: 123456' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================
// Auto-escalation timer: ທຸກ 10 ວິນາທີ
// ====================================
setInterval(async () => {
  try {
    const expired = await prisma.pickupRequest.findMany({
      where: {
        status: 'waiting',
        callType: { in: ['five_minutes', 'ten_minutes'] },
        expiresAt: { lte: new Date() }
      },
      include: { student: { include: { classroom: true } } }
    });

    for (const call of expired) {
      await prisma.pickupRequest.update({
        where: { id: call.id },
        data: { callType: 'arrived', status: 'announced', announcedAt: new Date(), expiresAt: null }
      });

      io.emit('call-escalated', {
        callId: call.id,
        studentId: call.studentId,
        previousType: call.callType,
        newType: 'arrived',
        student: call.student
      });

      console.log(`⏰ Auto-escalated: ${call.student.nickname || call.student.firstName} → arrived`);
    }

    if (expired.length > 0) {
      const queueData = await getQueueData();
      io.emit('queue-update', queueData);
    }
  } catch (err) {
    console.error('Auto-escalation error:', err.message);
  }
}, 10000);

// ====================================
// Socket.IO
// ====================================
setupSocketEvents(io);

// ====================================
// Serve frontend
// ====================================
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`⏰ Auto-escalation timer active (every 10s)`);
});

module.exports = { app, server, io, prisma };
