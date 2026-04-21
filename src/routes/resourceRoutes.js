// ─────────────────────────────────────────────────────────
// resourceRoutes.js — Resource Management API Routes
// Base path: /api/resources
// Admin routes: view all requests, create resources, approve/reject requests
// Teacher routes: view own requests, submit a new resource request
// Public (authenticated): list all available resources
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { verifyToken, isAdmin, isTeacher } = require('../middlewares/authMiddleware');

router.get('/requests', verifyToken, isAdmin, resourceController.getAllRequests);          // GET  /api/resources/requests      — all pending/approved requests (Admin only)
router.get('/my-requests', verifyToken, isTeacher, resourceController.getMyRequests);     // GET  /api/resources/my-requests   — teacher's own submitted requests
router.get('/', verifyToken, resourceController.getAllResources);                          // GET  /api/resources               — list all school resources
router.post('/', verifyToken, isAdmin, resourceController.createResource);                // POST /api/resources               — add a new resource (Admin only)
router.post('/requests', verifyToken, isTeacher, resourceController.requestResource);     // POST /api/resources/requests      — teacher submits a resource request
router.put('/requests/:id', verifyToken, isAdmin, resourceController.updateRequestStatus);// PUT  /api/resources/requests/:id  — approve/reject a request (Admin only)

module.exports = router;
