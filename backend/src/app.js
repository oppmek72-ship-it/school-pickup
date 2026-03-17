require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Make io and prisma accessible in routes
app.set('io', io);
app.set('prisma', prisma);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io
setupSocketEvents(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io, prisma };
