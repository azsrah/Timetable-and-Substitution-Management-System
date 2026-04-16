const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, subjectController.getAllSubjects);
router.post('/', verifyToken, isAdmin, subjectController.createSubject);
router.put('/:id', verifyToken, isAdmin, subjectController.updateSubject);
router.delete('/:id', verifyToken, isAdmin, subjectController.deleteSubject);

module.exports = router;
