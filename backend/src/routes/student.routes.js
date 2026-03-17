const express = require('express');
const router = express.Router();
const { getStudents, getStudent } = require('../controllers/student.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, getStudents);
router.get('/:id', authMiddleware, getStudent);

module.exports = router;
