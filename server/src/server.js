// ─────────────────────────────────────────────────────────
// server.js — Main entry point for the backend server
// Sets up Express, Socket.io, middleware, and all API routes
// ─────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app); // Wrap Express in an HTTP server so Socket.io can attach to it

// ── Socket.io Setup ───────────────────────────────────────
// Allow all origins so the frontend can connect via WebSockets
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// ── Global Middlewares ────────────────────────────────────
app.use(cors());            // Allow cross-origin requests from the React frontend
app.use(express.json());   // Parse incoming JSON request bodies

// Attach the Socket.io instance to every request so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Health Check Route ────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Timetable Management API is running...');
});

// ── Import All Route Modules ──────────────────────────────
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const substitutionRoutes = require('./routes/substitutionRoutes');
const userRoutes = require('./routes/userRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// ── Mount API Routes ──────────────────────────────────────
// Each route group handles a specific feature area
app.use('/api/auth', authRoutes);               // Login, register, verify email, forgot/reset password
app.use('/api/users', userRoutes);              // User CRUD and profile management
app.use('/api/classes', classRoutes);           // Class creation and subject assignment
app.use('/api/subjects', subjectRoutes);        // Subject management
app.use('/api/timetable', timetableRoutes);     // Timetable slots, periods, schedules
app.use('/api/resources', resourceRoutes);      // Resource requests and approvals
app.use('/api/substitutions', substitutionRoutes); // Substitution assignment and acceptance
app.use('/api/announcements', announcementRoutes); // Announcements for all roles
app.use('/api/notifications', notificationRoutes); // Persistent notification inbox
app.use('/api/attendance', attendanceRoutes);   // Teacher attendance check-in/out

// ── Socket.io Connection Handling ────────────────────────
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Clean up when a user disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ── Start the Server ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
