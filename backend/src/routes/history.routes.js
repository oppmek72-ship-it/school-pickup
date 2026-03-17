const express = require('express');
const router = express.Router();
const { getHistory, getStudentHistory } = require('../controllers/history.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, getHistory);
router.get('/:studentId', authMiddleware, getStudentHistory);

module.exports = router;
