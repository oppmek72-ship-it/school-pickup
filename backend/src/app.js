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
// Public voice endpoint (no auth — for Monitor)
// ====================================
app.get('/api/students/:id/voice', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { voiceRecording: true }
    });
    if (!student?.voiceRecording) return res.status(404).json({ error: 'No voice recording' });

    // Parse data URL: "data:audio/webm;base64,GkXfo..."
    const matches = student.voiceRecording.match(/^data:(audio\/[^;]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid audio data' });

    const contentType = matches[1];
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
// TTS endpoint — proxy Google Translate TTS
// ====================================
app.get('/api/tts', (req, res) => {
  const https = require('https');
  const text = (req.query.text || '').substring(0, 200);
  const lang = req.query.lang || 'lo';
  if (!text) return res.status(400).json({ error: 'Missing text' });

  const encoded = encodeURIComponent(text);
  const langs = [lang, 'th']; // Try requested lang first, then Thai fallback
  let tried = 0;

  function tryLang(l) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${l}&client=tw-ob&q=${encoded}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      }
    }, (proxyRes) => {
      // Handle redirect
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        https.get(proxyRes.headers.location, (rRes) => {
          res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' });
          rRes.pipe(res);
        }).on('error', () => nextLang());
        return;
      }
      if (proxyRes.statusCode === 200) {
        res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' });
        proxyRes.pipe(res);
      } else {
        nextLang();
      }
    }).on('error', () => nextLang());
  }

  function nextLang() {
    tried++;
    if (tried < langs.length) {
      tryLang(langs[tried]);
    } else {
      res.status(503).json({ error: 'TTS unavailable' });
    }
  }

  tryLang(langs[0]);
});

// ====================================
// Seed endpoint
// ====================================
app.all('/api/seed', async (req, res) => {
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
    const p12 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.1/2', gradeLevel: 'ປ.1', classCode: 'P1-2', teacherName: 'ຄູ ສີດາ' } });
    const p21 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.2/1', gradeLevel: 'ປ.2', classCode: 'P2-1', teacherName: 'ຄູ ວັນນາ' } });
    const p31 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.3/1', gradeLevel: 'ປ.3', classCode: 'P3-1', teacherName: 'ຄູ ສົມພອນ' } });
    const p41 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.4/1', gradeLevel: 'ປ.4', classCode: 'P4-1', teacherName: 'ຄູ ຫຼ້າ' } });
    const p51 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ປ.5/1', gradeLevel: 'ປ.5', classCode: 'P5-1', teacherName: 'ຄູ ພອນ' } });
    const m11 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ມ.1/1', gradeLevel: 'ມ.1', classCode: 'M1-1', teacherName: 'ຄູ ບຸນມາ' } });
    const m21 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ມ.2/1', gradeLevel: 'ມ.2', classCode: 'M2-1', teacherName: 'ຄູ ທອງຄຳ' } });
    const m31 = await prisma.classroom.create({ data: { className: 'ຫ້ອງ ມ.3/1', gradeLevel: 'ມ.3', classCode: 'M3-1', teacherName: 'ຄູ ສົມສັກ' } });

    await prisma.user.create({ data: { name: 'ແອັດມິນ', username: 'admin', role: 'admin', password: hash } });
    await prisma.user.create({ data: { name: 'ຄູ ມະນີ', username: 'P1-1', phone: '02010000001', role: 'teacher', password: hash, classroomId: p11.id } });
    await prisma.user.create({ data: { name: 'ຄູ ສີດາ', username: 'P1-2', phone: '02010000002', role: 'teacher', password: hash, classroomId: p12.id } });
    await prisma.user.create({ data: { name: 'ຄູ ວັນນາ', username: 'P2-1', phone: '02010000003', role: 'teacher', password: hash, classroomId: p21.id } });
    await prisma.user.create({ data: { name: 'ຄູ ສົມພອນ', username: 'P3-1', phone: '02010000004', role: 'teacher', password: hash, classroomId: p31.id } });
    await prisma.user.create({ data: { name: 'ຄູ ຫຼ້າ', username: 'P4-1', phone: '02010000005', role: 'teacher', password: hash, classroomId: p41.id } });
    await prisma.user.create({ data: { name: 'ຄູ ພອນ', username: 'P5-1', phone: '02010000006', role: 'teacher', password: hash, classroomId: p51.id } });
    await prisma.user.create({ data: { name: 'ຄູ ບຸນມາ', username: 'M1-1', phone: '02010000007', role: 'teacher', password: hash, classroomId: m11.id } });
    await prisma.user.create({ data: { name: 'ຄູ ທອງຄຳ', username: 'M2-1', phone: '02010000008', role: 'teacher', password: hash, classroomId: m21.id } });
    await prisma.user.create({ data: { name: 'ຄູ ສົມສັກ', username: 'M3-1', phone: '02010000009', role: 'teacher', password: hash, classroomId: m31.id } });

    await prisma.student.createMany({
      data: [
        { studentCode: 'STD-0001', firstName: 'ສົມສະໄໝ', lastName: 'ແກ້ວພິລາ', nickname: 'ນ້ອງໃໝ', classroomId: p31.id, parentName: 'ທ້າວ ສຸກສະຫວັນ', parentPhone: '02044444444' },
        { studentCode: 'STD-0002', firstName: 'ວິໄລ', lastName: 'ແກ້ວພິລາ', nickname: 'ນ້ອງຄຳ', classroomId: p11.id, parentName: 'ທ້າວ ສຸກສະຫວັນ', parentPhone: '02044444444' },
        { studentCode: 'STD-0003', firstName: 'ບຸນປ້ອ', lastName: 'ແກ້ວພິລາ', nickname: 'ນ້ອງປ້ອ', classroomId: m11.id, parentName: 'ທ້າວ ສຸກສະຫວັນ', parentPhone: '02044444444' },
        { studentCode: 'STD-0004', firstName: 'ເດືອນ', lastName: 'ພິມມະສານ', nickname: 'ນ້ອງເດືອນ', classroomId: p12.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
        { studentCode: 'STD-0005', firstName: 'ດາລາ', lastName: 'ພິມມະສານ', nickname: 'ນ້ອງດາ', classroomId: p21.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
        { studentCode: 'STD-0006', firstName: 'ບຸນທອງ', lastName: 'ພິມມະສານ', nickname: 'ນ້ອງທອງ', classroomId: p41.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
        { studentCode: 'STD-0007', firstName: 'ສຸພາ', lastName: 'ພິມມະສານ', nickname: 'ນ້ອງສຸ', classroomId: m21.id, parentName: 'ນາງ ບົວພາ', parentPhone: '02055555555' },
        { studentCode: 'STD-0008', firstName: 'ແກ້ວມະນີ', lastName: 'ຈັນທະລາ', nickname: 'ນ້ອງແກ້ວ', classroomId: p31.id, parentName: 'ທ້າວ ພູທອນ', parentPhone: '02066666666' },
        { studentCode: 'STD-0009', firstName: 'ວັນນາ', lastName: 'ຈັນທະລາ', nickname: 'ນ້ອງວັນ', classroomId: m21.id, parentName: 'ທ້າວ ພູທອນ', parentPhone: '02066666666' },
        { studentCode: 'STD-0010', firstName: 'ນິນ', lastName: 'ສີສະຫວາດ', nickname: 'ນ້ອງນິນ', classroomId: p21.id, parentName: 'ນາງ ມະນີວັນ', parentPhone: '02077777777' },
        { studentCode: 'STD-0011', firstName: 'ໂຊ', lastName: 'ສີສະຫວາດ', nickname: 'ນ້ອງໂຊ', classroomId: p51.id, parentName: 'ນາງ ມະນີວັນ', parentPhone: '02077777777' },
        { studentCode: 'STD-0012', firstName: 'ພິມ', lastName: 'ສີສະຫວາດ', nickname: 'ນ້ອງພິມ', classroomId: m31.id, parentName: 'ນາງ ມະນີວັນ', parentPhone: '02077777777' },
        { studentCode: 'STD-0013', firstName: 'ແສງ', lastName: 'ໄຊຍະພອນ', nickname: 'ນ້ອງແສງ', classroomId: p11.id, parentName: 'ທ້າວ ໄຊຍະສິດ', parentPhone: '02088888888' },
        { studentCode: 'STD-0014', firstName: 'ຈັນ', lastName: 'ໄຊຍະພອນ', nickname: 'ນ້ອງຈັນ', classroomId: p41.id, parentName: 'ທ້າວ ໄຊຍະສິດ', parentPhone: '02088888888' },
        { studentCode: 'STD-0015', firstName: 'ດາວ', lastName: 'ພົມມະຈັນ', nickname: 'ນ້ອງດາວ', classroomId: m11.id, parentName: 'ນາງ ພອນສະຫວັນ', parentPhone: '02099999999' },
      ]
    });

    res.json({ success: true, message: 'Seed ສຳເລັດ! 6 ຄອບຄົວ, 15 ນັກຮຽນ, 10 users. Password: 123456' });
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
