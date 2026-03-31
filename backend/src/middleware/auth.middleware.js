const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Parent login via studentCode
    if (decoded.studentCode && decoded.role === 'parent') {
      req.user = {
        id: decoded.studentId,
        role: 'parent',
        studentCode: decoded.studentCode,
        studentId: decoded.studentId,
        parentPhone: decoded.parentPhone
      };
      return next();
    }

    // Staff login via userId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { classroom: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
