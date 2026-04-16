const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, notificationController.getUserNotifications);
router.put('/read-all', verifyToken, notificationController.markAllAsRead);
router.put('/:id/read', verifyToken, notificationController.markAsRead);
router.delete('/', verifyToken, notificationController.clearNotifications);

module.exports = router;
