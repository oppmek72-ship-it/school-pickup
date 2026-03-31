const express = require('express');
const router = express.Router();
const { getStudents, searchStudents, getStudent, createStudent, updateStudent, deleteStudent, getClassrooms } = require('../controllers/student.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.get('/search', authMiddleware, searchStudents);
router.get('/classrooms', authMiddleware, getClassrooms);
router.get('/', authMiddleware, getStudents);
router.get('/:id', authMiddleware, getStudent);
router.post('/', authMiddleware, roleMiddleware('admin'), createStudent);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateStudent);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteStudent);

module.exports = router;
