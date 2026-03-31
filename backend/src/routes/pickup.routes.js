const express = require('express');
const router = express.Router();
const { createRequest, confirmPickup, cancelRequest, getQueue, getActiveQueue, getStudentActiveCall, escalateCall } = require('../controllers/pickup.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.post('/call', authMiddleware, createRequest);
router.put('/:id/confirm', authMiddleware, roleMiddleware('teacher', 'admin'), confirmPickup);
router.put('/:id/cancel', authMiddleware, cancelRequest);
router.put('/:id/escalate', authMiddleware, roleMiddleware('teacher', 'admin'), escalateCall);
router.get('/queue', authMiddleware, getQueue);
router.get('/active', getActiveQueue);  // public for monitor
router.get('/student/:studentId/active', authMiddleware, getStudentActiveCall);

module.exports = router;
