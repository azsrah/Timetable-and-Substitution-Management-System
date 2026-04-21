// ─────────────────────────────────────────────────────────
// userRoutes.js — User Management API Routes
// Base path: /api/users
// Admin-only: manage teachers and student status
// Any authenticated user: change own password and update profile
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAdmin, userController.getAllUsers);            // GET    /api/users          — list all teachers & students (Admin only)
router.post('/teacher', verifyToken, isAdmin, userController.createTeacher); // POST   /api/users/teacher   — create a new teacher account (Admin only)
router.put('/teacher/:id', verifyToken, isAdmin, userController.updateTeacher); // PUT /api/users/teacher/:id — update teacher details & subjects (Admin only)
router.put('/:id/status', verifyToken, isAdmin, userController.updateUserStatus); // PUT /api/users/:id/status — activate or deactivate a user (Admin only)
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);      // DELETE /api/users/:id       — permanently remove a user (Admin only)
router.put('/change-password', verifyToken, userController.changePassword);  // PUT   /api/users/change-password — change own password (any logged-in user)
router.put('/profile', verifyToken, userController.updateProfile);           // PUT   /api/users/profile        — update own contact info (any logged-in user)

module.exports = router;
