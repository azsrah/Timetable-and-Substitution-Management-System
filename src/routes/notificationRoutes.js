// ─────────────────────────────────────────────────────────
// notificationRoutes.js — Notification API Routes
// Base path: /api/notifications
// All routes require authentication (any logged-in user can manage their own inbox)
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, notificationController.getUserNotifications);       // GET    /api/notifications          — fetch user's notification inbox
router.put('/read-all', verifyToken, notificationController.markAllAsRead);      // PUT    /api/notifications/read-all — mark every notification as read
router.put('/:id/read', verifyToken, notificationController.markAsRead);         // PUT    /api/notifications/:id/read — mark one notification as read
router.delete('/', verifyToken, notificationController.clearNotifications);      // DELETE /api/notifications          — clear entire inbox

module.exports = router;
