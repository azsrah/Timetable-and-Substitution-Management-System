// ─────────────────────────────────────────────────────────
// subjectRoutes.js — Subject Management API Routes
// Base path: /api/subjects
// Any authenticated user can read subjects (needed in timetable views)
// Only Admins can create, update, or delete subjects
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, subjectController.getAllSubjects);                    // GET    /api/subjects      — list all subjects
router.post('/', verifyToken, isAdmin, subjectController.createSubject);           // POST   /api/subjects      — add a new subject (Admin only)
router.put('/:id', verifyToken, isAdmin, subjectController.updateSubject);         // PUT    /api/subjects/:id  — update subject name/code/resource type (Admin only)
router.delete('/:id', verifyToken, isAdmin, subjectController.deleteSubject);      // DELETE /api/subjects/:id  — remove a subject (Admin only)

module.exports = router;
