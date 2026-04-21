// ─────────────────────────────────────────────────────────
// authRoutes.js — Authentication API Routes
// Base path: /api/auth
// Public routes (no token needed): login, register, OTP verify, password reset
// Protected route: /me — requires a valid JWT to get the current user's profile
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);                   // POST /api/auth/login
router.post('/register', authController.registerStudent);      // POST /api/auth/register
router.post('/verify-email', authController.verifyEmail);      // POST /api/auth/verify-email
router.post('/forgot-password', authController.forgotPassword);// POST /api/auth/forgot-password
router.post('/reset-password', authController.resetPassword);  // POST /api/auth/reset-password
router.get('/me', verifyToken, authController.getMe);          // GET  /api/auth/me (protected)

module.exports = router;
