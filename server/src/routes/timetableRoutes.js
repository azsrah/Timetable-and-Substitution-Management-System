const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/periods', verifyToken, timetableController.getAllPeriods);
router.get('/class/:classId', verifyToken, timetableController.getClassTimetable);
router.get('/teacher/:teacherId', verifyToken, timetableController.getTeacherTimetable);
router.post('/', verifyToken, isAdmin, timetableController.saveTimetableSlot);

module.exports = router;
