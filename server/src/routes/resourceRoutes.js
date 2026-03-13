const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { verifyToken, isAdmin, isTeacher } = require('../middlewares/authMiddleware');

router.get('/requests', verifyToken, isAdmin, resourceController.getAllRequests);
router.get('/', verifyToken, resourceController.getAllResources);
router.post('/', verifyToken, isAdmin, resourceController.createResource);
router.post('/requests', verifyToken, isTeacher, resourceController.requestResource);
router.put('/requests/:id', verifyToken, isAdmin, resourceController.updateRequestStatus);

module.exports = router;
