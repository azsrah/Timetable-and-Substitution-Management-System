// ─────────────────────────────────────────────────────────
// attendanceRoutes.js — Attendance API Routes
// Base path: /api/attendance
// Admin route: view all teachers' attendance records
// Teacher routes: get own status, check in, check out
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAdmin, attendanceController.getAllAttendance);  // GET  /api/attendance         — all teacher records for a date/range (Admin only)
router.get('/status', verifyToken, attendanceController.getStatus);           // GET  /api/attendance/status  — get today's check-in status (Teacher)
router.post('/check-in', verifyToken, attendanceController.checkIn);          // POST /api/attendance/check-in  — record check-in time (Teacher)
router.post('/check-out', verifyToken, attendanceController.checkOut);        // POST /api/attendance/check-out — record check-out time (Teacher)

module.exports = router;
