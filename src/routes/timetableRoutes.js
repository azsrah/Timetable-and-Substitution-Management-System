// ─────────────────────────────────────────────────────────
// timetableRoutes.js — Timetable API Routes
// Base path: /api/timetable
// Read routes: accessible by any authenticated user
// Write route (POST /): Admin only — creating/editing timetable slots
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/periods', verifyToken, timetableController.getAllPeriods);                    // GET /api/timetable/periods             — all time periods
router.get('/class/:classId', verifyToken, timetableController.getClassTimetable);        // GET /api/timetable/class/:classId       — weekly grid for a class
router.get('/teacher/:teacherId', verifyToken, timetableController.getTeacherTimetable);  // GET /api/timetable/teacher/:teacherId   — weekly grid for a teacher
router.get('/today/:role/:id', verifyToken, timetableController.getTodaySchedule);        // GET /api/timetable/today/:role/:id      — personalized today's schedule
router.get('/workload/:teacherId', verifyToken, timetableController.getTeacherWorkload);  // GET /api/timetable/workload/:teacherId  — period count & overload status
router.post('/', verifyToken, isAdmin, timetableController.saveTimetableSlot);            // POST /api/timetable                     — save/update a slot (Admin only)

module.exports = router;
