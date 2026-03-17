const express = require('express');
const router = express.Router();
const { createRequest, markArrived, confirmPickup, getQueue, getActiveQueue, cancelRequest } = require('../controllers/pickup.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.post('/request', authMiddleware, roleMiddleware('parent'), createRequest);
router.put('/:id/arrive', authMiddleware, roleMiddleware('parent'), markArrived);
router.put('/:id/confirm', authMiddleware, roleMiddleware('teacher', 'admin'), confirmPickup);
router.get('/queue', authMiddleware, roleMiddleware('teacher', 'admin'), getQueue);
router.get('/active', getActiveQueue); // Public for gate display
router.delete('/:id/cancel', authMiddleware, cancelRequest);

module.exports = router;
