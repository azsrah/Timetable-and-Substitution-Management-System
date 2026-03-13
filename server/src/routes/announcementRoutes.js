const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { verifyToken, isAdmin, isTeacher } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, announcementController.getAllAnnouncements);
router.post('/', verifyToken, isTeacher, announcementController.createAnnouncement);
router.delete('/:id', verifyToken, isTeacher, announcementController.deleteAnnouncement);

module.exports = router;
