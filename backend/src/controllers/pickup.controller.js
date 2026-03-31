const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ====================================
// ສ້າງ call ໃໝ່
// ====================================
const createRequest = async (req, res) => {
  try {
    const { studentId, callType, carPlate, carColor } = req.body;
    // callType: "five_minutes" | "ten_minutes" | "arrived"

    const existing = await prisma.pickupRequest.findFirst({
      where: { studentId: parseInt(studentId), status: { in: ['waiting', 'announced'] } }
    });
    if (existing) {
      return res.status(400).json({ error: 'ນັກຮຽນຄົນນີ້ຖືກເອີ້ນຢູ່ແລ້ວ' });
    }

    // ຄຳນວນ expiresAt
    let expiresAt = null;
    if (callType === 'five_minutes') expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    if (callType === 'ten_minutes') expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // ລຳດັບຄິວ
    const lastQueue = await prisma.pickupRequest.findFirst({
      where: { status: { in: ['waiting', 'announced'] } },
      orderBy: { queuePosition: 'desc' }
    });
    const queuePosition = (lastQueue?.queuePosition || 0) + 1;

    const parentId = req.user.role === 'parent' ? (req.user.userId || req.user.id) : null;

    const request = await prisma.pickupRequest.create({
      data: {
        studentId: parseInt(studentId),
        parentId: parentId || null,
        callType: callType || 'arrived',
        status: 'waiting',
        expiresAt,
        queuePosition,
        carPlate,
        carColor
      },
      include: {
        student: { include: { classroom: true } },
        parent: { select: { id: true, name: true, phone: true } }
      }
    });

    const io = req.app.get('io');
    const queueData = await getQueueData();

    io.emit('new-call', {
      callId: request.id,
      student: request.student,
      callType: request.callType,
      calledAt: request.calledAt,
      expiresAt: request.expiresAt,
      queuePosition: request.queuePosition
    });
    io.emit('queue-update', queueData);

    // Notify teacher ຂອງຫ້ອງ
    if (request.student.classroomId) {
      const teacher = await prisma.user.findFirst({
        where: { classroomId: request.student.classroomId, role: 'teacher' }
      });
      if (teacher) {
        const callLabel = callType === 'five_minutes' ? '5 ນາທີ' : callType === 'ten_minutes' ? '10 ນາທີ' : 'ຮອດແລ້ວ';
        await prisma.notification.create({
          data: {
            userId: teacher.id,
            message: `ຜູ້ປົກຄອງຂອງ ${request.student.nickname || request.student.firstName} ກຳລັງມາ (${callLabel})`,
            type: 'pickup_request'
          }
        });
        io.to(`classroom_${request.student.classroomId}`).emit('notification:new', {
          message: `ຜູ້ປົກຄອງຂອງ ${request.student.nickname || request.student.firstName} ກຳລັງມາ (${callLabel})`
        });
      }
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'ສ້າງ call ບໍ່ສຳເລັດ' });
  }
};

// ====================================
// ຮັບນ້ອງແລ້ວ (teacher ກົດ)
// ====================================
const confirmPickup = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.pickupRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'picked_up', pickedUpAt: new Date() },
      include: {
        student: { include: { classroom: true } },
        parent: { select: { id: true, name: true } }
      }
    });

    await prisma.pickupHistory.create({
      data: {
        studentId: request.studentId,
        parentId: request.parentId || 1,
        teacherId: req.user?.id || null,
        callType: request.callType,
        carPlate: request.carPlate
      }
    });

    const io = req.app.get('io');
    const queueData = await getQueueData();
    io.emit('call-completed', { callId: request.id, studentId: request.studentId, pickedUpAt: request.pickedUpAt });
    io.emit('queue-update', queueData);

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'ຢືນຢັນ pickup ບໍ່ສຳເລັດ' });
  }
};

// ====================================
// ຍົກເລີກ
// ====================================
const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.pickupRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelled' },
      include: { student: true }
    });

    const io = req.app.get('io');
    const queueData = await getQueueData();
    io.emit('call-cancelled', { callId: request.id, studentId: request.studentId });
    io.emit('queue-update', queueData);

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'ຍົກເລີກ call ບໍ່ສຳເລັດ' });
  }
};

// ====================================
// ດຶງ queue (3 ຊ່ອງ)
// ====================================
const getQueue = async (req, res) => {
  try {
    const data = await getQueueData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'ດຶງ queue ບໍ່ສຳເລັດ' });
  }
};

const getActiveQueue = async (req, res) => {
  try {
    const data = await getQueueData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'ດຶງ queue ບໍ່ສຳເລັດ' });
  }
};

// ====================================
// ດຶງ calls ຂອງນັກຮຽນ 1 ຄົນ
// ====================================
const getStudentActiveCall = async (req, res) => {
  try {
    const { studentId } = req.params;
    const call = await prisma.pickupRequest.findFirst({
      where: { studentId: parseInt(studentId), status: { in: ['waiting', 'announced'] } },
      orderBy: { calledAt: 'desc' }
    });
    res.json(call);
  } catch (error) {
    res.status(500).json({ error: 'ດຶງ call ບໍ່ສຳເລັດ' });
  }
};

// ====================================
// ຍ້າຍ call ຈາກ 5min → arrived (auto-escalation)
// ====================================
const escalateCall = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.pickupRequest.update({
      where: { id: parseInt(id) },
      data: { callType: 'arrived', status: 'announced', announcedAt: new Date(), expiresAt: null },
      include: { student: { include: { classroom: true } } }
    });

    const io = req.app.get('io');
    const queueData = await getQueueData();
    io.emit('call-escalated', {
      callId: request.id,
      studentId: request.studentId,
      previousType: request.callType,
      newType: 'arrived'
    });
    io.emit('queue-update', queueData);

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Escalate ບໍ່ສຳເລັດ' });
  }
};

// ====================================
// Helper: ດຶງ queue data ຈັດ 3 ຊ່ອງ
// ====================================
async function getQueueData() {
  const allActive = await prisma.pickupRequest.findMany({
    where: { status: { in: ['waiting', 'announced'] } },
    include: {
      student: { include: { classroom: true } },
      parent: { select: { id: true, name: true, phone: true } }
    },
    orderBy: { queuePosition: 'asc' }
  });

  return {
    fiveMinutes: allActive.filter(r => r.callType === 'five_minutes'),
    tenMinutes: allActive.filter(r => r.callType === 'ten_minutes'),
    arrived: allActive.filter(r => r.callType === 'arrived'),
    all: allActive
  };
}

module.exports = { createRequest, confirmPickup, cancelRequest, getQueue, getActiveQueue, getStudentActiveCall, escalateCall, getQueueData };
