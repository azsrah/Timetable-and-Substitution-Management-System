// ─────────────────────────────────────────────────────────
// classRoutes.js — Class Management API Routes
// Base path: /api/classes
// GET /: Public (no token) — needed for the student registration form dropdown
// All write operations require Admin authentication
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', classController.getAllClasses);                                            // GET    /api/classes                     — list all classes (public, used in registration)
router.post('/', verifyToken, isAdmin, classController.createClass);                      // POST   /api/classes                     — create a new class (Admin only)
router.delete('/:id', verifyToken, isAdmin, classController.deleteClass);                 // DELETE /api/classes/:id                  — delete a class (Admin only)
router.post('/:classId/subjects', verifyToken, isAdmin, classController.assignSubjectToClass); // POST /api/classes/:classId/subjects — assign a subject to a class (Admin only)

module.exports = router;
