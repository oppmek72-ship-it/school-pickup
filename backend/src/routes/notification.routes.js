const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead } = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, getNotifications);
router.put('/read', authMiddleware, markAllRead);

module.exports = router;
