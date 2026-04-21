// ─────────────────────────────────────────────────────────
// substitutionRoutes.js — Substitution API Routes
// Base path: /api/substitutions
// Admin routes: suggest substitutes, assign, view all
// Teacher routes: view own assignments, accept a substitution
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const substitutionController = require('../controllers/substitutionController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/suggest', verifyToken, isAdmin, substitutionController.suggestSubstitute);          // GET  /api/substitutions/suggest           — find free teachers (Admin only)
router.post('/assign', verifyToken, isAdmin, substitutionController.assignSubstitution);         // POST /api/substitutions/assign            — assign a substitute (Admin only)
router.get('/all', verifyToken, isAdmin, substitutionController.getAllSubstitutions);             // GET  /api/substitutions/all               — full substitution list (Admin only)
router.get('/teacher/:teacherId', verifyToken, substitutionController.getTeacherSubstitutions);  // GET  /api/substitutions/teacher/:teacherId — teacher's own assignments
router.put('/:id/accept', verifyToken, substitutionController.acceptSubstitution);               // PUT  /api/substitutions/:id/accept         — teacher accepts the assignment

module.exports = router;
