const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', classController.getAllClasses);
router.post('/', verifyToken, isAdmin, classController.createClass);
router.delete('/:id', verifyToken, isAdmin, classController.deleteClass);
router.post('/:classId/subjects', verifyToken, isAdmin, classController.assignSubjectToClass);

module.exports = router;
