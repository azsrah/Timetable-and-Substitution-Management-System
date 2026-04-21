// ─────────────────────────────────────────────────────────
// announcementRoutes.js — Announcement API Routes
// Base path: /api/announcements
// All authenticated users can read announcements
// Teachers and Admins can create and delete announcements
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { verifyToken, isAdmin, isTeacher } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, announcementController.getAllAnnouncements);              // GET    /api/announcements      — fetch role-filtered announcements
router.post('/', verifyToken, isTeacher, announcementController.createAnnouncement);  // POST   /api/announcements      — create a new announcement (Teacher/Admin)
router.delete('/:id', verifyToken, isTeacher, announcementController.deleteAnnouncement); // DELETE /api/announcements/:id — remove an announcement (Teacher/Admin)

module.exports = router;
