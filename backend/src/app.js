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
const setupSocketEvents = require('./socket/events');

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io and prisma accessible in routes
app.set('io', io);
app.set('prisma', prisma);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Seed endpoint (for initial production setup)
app.post('/api/seed', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    await prisma.notification.deleteMany();
    await prisma.pickupHistory.deleteMany();
    await prisma.pickupRequest.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();

    const hash = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.create({ data: { name: 'ທ່ານ ບຸນມີ', phone: '02099999999', role: 'admin', password: hash } });
    const t1 = await prisma.user.create({ data: { name: 'ອາຈານ ສົມພອນ', phone: '02011111111', role: 'teacher', password: hash } });
    const t2 = await prisma.user.create({ data: { name: 'ອາຈານ ວິໄລ', phone: '02022222222', role: 'teacher', password: hash } });
    const p1 = await prisma.user.create({ data: { name: 'ທ້າວ ສຸກສະຫວັນ', phone: '02033333333', role: 'parent', password: hash } });
    const p2 = await prisma.user.create({ data: { name: 'ນາງ ບົວພາ', phone: '02044444444', role: 'parent', password: hash } });
    const p3 = await prisma.user.create({ data: { name: 'ທ້າວ ພູທອນ', phone: '02055555555', role: 'parent', password: hash } });

    await prisma.student.createMany({
      data: [
        { name: 'ນ້ອງ ອານັນ', class: 'P1', qrCode: 'STU001', parentId: p1.id, teacherId: t1.id },
        { name: 'ນ້ອງ ສົມພອນ', class: 'P2', qrCode: 'STU002', parentId: p1.id, teacherId: t1.id },
        { name: 'ນ້ອງ ພອນ', class: 'P1', qrCode: 'STU003', parentId: p2.id, teacherId: t1.id },
        { name: 'ນ້ອງ ແກ້ວ', class: 'P3', qrCode: 'STU004', parentId: p2.id, teacherId: t2.id },
        { name: 'ນ້ອງ ດາວ', class: 'P2', qrCode: 'STU005', parentId: p3.id, teacherId: t2.id }
      ]
    });

    res.json({ success: true, message: 'Seed complete! Password: 123456' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// SPA fallback - all non-API routes serve index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Socket.io
setupSocketEvents(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io, prisma };
