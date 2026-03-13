const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAdmin, userController.getAllUsers);
router.post('/teacher', verifyToken, isAdmin, userController.createTeacher);
router.put('/:id/status', verifyToken, isAdmin, userController.updateUserStatus);
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
