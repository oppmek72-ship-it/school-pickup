const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

module.exports = { login, logout, getMe };
