const express = require('express');
const router = express.Router();
const substitutionController = require('../controllers/substitutionController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/suggest', verifyToken, isAdmin, substitutionController.suggestSubstitute);
router.post('/assign', verifyToken, isAdmin, substitutionController.assignSubstitution);
router.get('/all', verifyToken, isAdmin, substitutionController.getAllSubstitutions);
router.get('/teacher/:teacherId', verifyToken, substitutionController.getTeacherSubstitutions);
router.put('/:id/accept', verifyToken, substitutionController.acceptSubstitution);

module.exports = router;
