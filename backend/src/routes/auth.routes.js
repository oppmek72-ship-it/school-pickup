const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

module.exports = router;
