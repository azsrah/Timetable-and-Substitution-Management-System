// ─────────────────────────────────────────────────────────
// authMiddleware.js — Route Protection Middleware
// These functions run before protected route handlers to
// ensure the request comes from a valid, authenticated user
// with the correct role.
// ─────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');

// ── verifyToken ───────────────────────────────────────────
// Checks that the request has a valid JWT in the Authorization header.
// If valid, attaches the decoded user info (id, role, name) to req.user
// so downstream controllers can use it.
exports.verifyToken = (req, res, next) => {
  // Extract the token from "Bearer <token>" format
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    // Verify the token using the secret key from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to the request for use in controllers
    next();             // Continue to the actual route handler
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' }); // Token is expired or tampered
  }
};

// ── isAdmin ───────────────────────────────────────────────
// Only allows users with the 'Admin' role to proceed.
// Used on admin-only routes like timetable editing and user management.
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// ── isTeacher ─────────────────────────────────────────────
// Allows both Teachers and Admins to access teacher routes.
// Admins have elevated access so they can view teacher dashboards too.
exports.isTeacher = (req, res, next) => {
  if (req.user && (req.user.role === 'Teacher' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Teacher only.' });
  }
};
