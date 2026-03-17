const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createRequest = async (req, res) => {
  try {
    const { studentId, eta, carPlate, carColor } = req.body;

    // Check for existing active request
    const existing = await prisma.pickupRequest.findFirst({
      where: {
        studentId,
        status: { in: ['coming', 'arrived'] }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Active pickup request already exists for this student' });
    }

    const request = await prisma.pickupRequest.create({
      data: {
        studentId,
        parentId: req.user.id,
        eta,
        carPlate,
        carColor,
        status: 'coming'
      },
      include: {
        student: true,
        parent: { select: { id: true, name: true, phone: true } }
      }
    });

    // Update student status
    await prisma.student.update({
      where: { id: studentId },
      data: { status: 'called' }
    });

    // Emit socket event
    const io = req.app.get('io');
    const queue = await getQueueData();
    io.emit('queue:updated', { queue });

    // Notify teacher
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { teacher: true }
    });

    if (student) {
      await prisma.notification.create({
        data: {
          userId: student.teacherId,
          message: `ຜູ້ປົກຄອງຂອງ ${student.name} ກຳລັງມາຮັບ (${eta} ນາທີ)`,
          type: 'pickup_request'
        }
      });

      io.emit('notification:new', {
        userId: student.teacherId,
        message: `ຜູ້ປົກຄອງຂອງ ${student.name} ກຳລັງມາຮັບ (${eta} ນາທີ)`,
        type: 'pickup_request'
      });
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create pickup request' });
  }
};

const markArrived = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.pickupRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'arrived' },
      include: {
        student: true,
        parent: { select: { id: true, name: true, phone: true } }
      }
    });

    const io = req.app.get('io');
    const queue = await getQueueData();
    io.emit('queue:updated', { queue });
    io.emit('student:called', {
      studentName: request.student.name,
      class: request.student.class
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pickup request' });
  }
};

const confirmPickup = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.pickupRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'confirmed' },
      include: {
        student: true,
        parent: { select: { id: true, name: true, phone: true } }
      }
    });

    // Update student status
    await prisma.student.update({
      where: { id: request.studentId },
      data: { status: 'picked_up' }
    });

    // Create history record
    await prisma.pickupHistory.create({
      data: {
        studentId: request.studentId,
        parentId: request.parentId,
        teacherId: req.user.id,
        carPlate: request.carPlate
      }
    });

    const io = req.app.get('io');
    const queue = await getQueueData();
    io.emit('queue:updated', { queue });
    io.emit('pickup:confirmed', {
      studentId: request.studentId,
      message: `${request.student.name} ຖືກຮັບແລ້ວ`
    });

    // Notify parent
    await prisma.notification.create({
      data: {
        userId: request.parentId,
        message: `ການຮັບ ${request.student.name} ໄດ້ຮັບການຢືນຢັນແລ້ວ`,
        type: 'pickup_confirmed'
      }
    });

    io.emit('notification:new', {
      userId: request.parentId,
      message: `ການຮັບ ${request.student.name} ໄດ້ຮັບການຢືນຢັນແລ້ວ`,
      type: 'pickup_confirmed'
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm pickup' });
  }
};

const getQueue = async (req, res) => {
  try {
    const queue = await getQueueData();
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
};

const getActiveQueue = async (req, res) => {
  try {
    const queue = await getQueueData();
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active queue' });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.pickupRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelled' },
      include: { student: true }
    });

    // Reset student status
    await prisma.student.update({
      where: { id: request.studentId },
      data: { status: 'at_school' }
    });

    const io = req.app.get('io');
    const queue = await getQueueData();
    io.emit('queue:updated', { queue });

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel request' });
  }
};

async function getQueueData() {
  return prisma.pickupRequest.findMany({
    where: { status: { in: ['coming', 'arrived'] } },
    include: {
      student: true,
      parent: { select: { id: true, name: true, phone: true } }
    },
    orderBy: { requestTime: 'asc' }
  });
}

module.exports = { createRequest, markArrived, confirmPickup, getQueue, getActiveQueue, cancelRequest };
