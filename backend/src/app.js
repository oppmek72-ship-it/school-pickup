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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.options('*', cors());
app.use(express.json({ limit: '2mb' }));

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
// Voice: GET — ຫຼິ້ນສຽງ (public, ບໍ່ຕ້ອງ login — ສຳລັບ Monitor)
// ====================================
app.get('/api/students/:id/voice', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { voiceRecording: true }
    });
    if (!student?.voiceRecording) return res.status(404).json({ error: 'No voice recording' });

    // Handle: data:audio/webm;codecs=opus;base64,xxx OR data:audio/wav;base64,xxx
    const matches = student.voiceRecording.match(/^data:(audio\/[^;]+(?:;[^;]+)*);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid audio data' });

    const fullMimeType = matches[1]; // e.g. "audio/webm;codecs=opus"
    const contentType = fullMimeType.split(';')[0]; // e.g. "audio/webm"
    const buffer = Buffer.from(matches[2], 'base64');
    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=3600',
    });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get voice' });
  }
});

// ====================================
// Voice: PUT — ບັນທຶກສຽງ (ຕ້ອງ login, admin ຫຼື teacher)
// ====================================
const authMiddleware = require('./middleware/auth.middleware');

app.put('/api/voice/:id', authMiddleware, async (req, res) => {
  try {
    const { voiceRecording } = req.body;
    if (!voiceRecording || !voiceRecording.startsWith('data:audio/')) {
      return res.status(400).json({ error: 'Invalid audio data' });
    }
    if (voiceRecording.length > 2000000) {
      return res.status(400).json({ error: 'Audio too large' });
    }
    await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: { voiceRecording }
    });
    res.json({ success: true, message: 'ບັນທຶກສຽງສຳເລັດ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// Voice: DELETE — ລຶບສຽງ (ຕ້ອງ login, admin ຫຼື teacher)
// ====================================
app.delete('/api/voice/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: { voiceRecording: null }
    });
    res.json({ success: true, message: 'ລຶບສຽງສຳເລັດ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// Import students from JSON data
// ====================================
app.all('/api/import-students', async (req, res) => {
  try {
    const studentData = require('./student-data.json');

    // 1. ລຶບ data ເກົ່າ (ເກັບ users ໄວ້)
    await prisma.notification.deleteMany();
    await prisma.pickupHistory.deleteMany();
    await prisma.pickupRequest.deleteMany();
    await prisma.student.deleteMany();
    await prisma.classroom.deleteMany();

    // 2. ສ້າງ admin ຖ້າບໍ່ມີ
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('123456', 10);
    const existingAdmin = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (!existingAdmin) {
      await prisma.user.create({ data: { name: 'ແອັດມິນ', username: 'admin', role: 'admin', password: hash } });
    }

    // 3. ສ້າງ classroom ທັງໝົດ
    const rooms = [...new Set(studentData.map(s => s.room))];
    const classroomMap = {};

    for (const room of rooms) {
      // ສ້າງ gradeLevel ແລະ classCode
      let gradeLevel = room;
      let classCode = room.replace(/\s+/g, '-');

      if (room.startsWith('ປະຖົມ')) gradeLevel = 'ປະຖົມ';
      else if (room.startsWith('ມັດທະຍົມ')) gradeLevel = 'ມັດທະຍົມ';
      else if (room.startsWith('ອະນຸບານ')) gradeLevel = 'ອະນຸບານ';
      else if (room.startsWith('ລ້ຽງເດັກ')) gradeLevel = 'ລ້ຽງເດັກ';

      const created = await prisma.classroom.create({
        data: {
          className: room,
          gradeLevel: gradeLevel,
          classCode: classCode,
          teacherName: '',
        }
      });
      classroomMap[room] = created.id;
    }

    // 4. ສ້າງ students ທັງໝົດ (batch 50)
    let created = 0;
    const batchSize = 50;
    for (let i = 0; i < studentData.length; i += batchSize) {
      const batch = studentData.slice(i, i + batchSize);
      await prisma.student.createMany({
        data: batch.map(s => ({
          studentCode: s.studentCode,
          firstName: s.firstName,
          lastName: s.lastName,
          classroomId: classroomMap[s.room],
        }))
      });
      created += batch.length;
    }

    res.json({
      success: true,
      message: `Import ສຳເລັດ! ${created} ນັກຮຽນ, ${rooms.length} ຫ້ອງຮຽນ`,
      stats: { students: created, classrooms: rooms.length, rooms }
    });
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

// ====================================
// Ensure admin user exists on startup (idempotent)
// ====================================
async function ensureAdminUser() {
  try {
    const existing = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (!existing) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: { name: 'ແອັດມິນ', username: 'admin', role: 'admin', password: hash, isActive: true }
      });
      console.log('✅ Admin user created: admin / 123456');
    } else {
      console.log('✅ Admin user ready: admin / 123456');
    }
  } catch (e) {
    console.error('⚠️ ensureAdminUser failed:', e.message);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`⏰ Auto-escalation timer active (every 10s)`);
  await ensureAdminUser();
});

module.exports = { app, server, io, prisma };
