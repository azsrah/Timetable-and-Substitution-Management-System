const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, isAdmin, isTeacher } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, isAdmin, attendanceController.recordAttendance);
router.get('/suggest', verifyToken, isAdmin, attendanceController.suggestSubstitute);
router.post('/substitute', verifyToken, isAdmin, attendanceController.assignSubstitution);
router.get('/substitutions', verifyToken, isAdmin, attendanceController.getAllSubstitutions);
router.get('/teacher/:teacherId', verifyToken, attendanceController.getTeacherSubstitutions);
router.put('/substitute/:id/accept', verifyToken, attendanceController.acceptSubstitution);

module.exports = router;
