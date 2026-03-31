const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ====================================
// Parent Login — ໃສ່ Student Code ເທົ່ານັ້ນ
// ====================================
const parentLogin = async (req, res) => {
  try {
    const { studentCode } = req.body;
    if (!studentCode) return res.status(400).json({ error: 'ກະລຸນາໃສ່ລະຫັດນັກຮຽນ' });

    const student = await prisma.student.findUnique({
      where: { studentCode: studentCode.trim().toUpperCase() },
      include: { classroom: true }
    });

    if (!student || !student.isActive) {
      return res.status(401).json({ error: 'ບໍ່ພົບນັກຮຽນທີ່ມີລະຫັດນີ້' });
    }

    // ສ້າງ virtual parent user object ຈາກຂໍ້ມູນນັກຮຽນ
    const token = jwt.sign(
      { studentCode: student.studentCode, role: 'parent', studentId: student.id, parentPhone: student.parentPhone },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: student.id,
        name: student.parentName || 'ຜູ້ປົກຄອງ',
        role: 'parent',
        studentCode: student.studentCode
      },
      student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login ບໍ່ສຳເລັດ' });
  }
};

// ====================================
// Teacher/Admin Login — username + password
// ====================================
const staffLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ' });

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { phone: username.trim() }
        ],
        isActive: true
      },
      include: { classroom: true }
    });

    if (!user) return res.status(401).json({ error: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' });

    const token = jwt.sign(
      { userId: user.id, role: user.role, classroomId: user.classroomId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login ບໍ່ສຳເລັດ' });
  }
};

// Legacy combined login (ໃຊ້ຕໍ່ໄດ້)
const login = async (req, res) => {
  const { studentCode, username, phone, password } = req.body;
  if (studentCode) return parentLogin(req, res);
  req.body.username = username || phone;
  return staffLogin(req, res);
};

const logout = (req, res) => res.json({ message: 'Logged out' });

const getMe = async (req, res) => {
  try {
    if (req.user.role === 'parent' && req.user.studentCode) {
      const student = await prisma.student.findUnique({
        where: { studentCode: req.user.studentCode },
        include: { classroom: true }
      });
      return res.json({ ...req.user, student });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { classroom: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...u } = user;
    res.json(u);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

module.exports = { login, parentLogin, staffLogin, logout, getMe };
