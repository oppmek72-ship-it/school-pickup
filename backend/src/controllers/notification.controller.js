const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, status: 'unread' },
      data: { status: 'read' }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

module.exports = { getNotifications, markAllRead };
