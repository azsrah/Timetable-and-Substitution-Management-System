const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Sockets configuration
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// io instance available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Timetable Management API is running...');
});

// Import API routes
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const userRoutes = require('./routes/userRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/announcements', announcementRoutes);

// Socket Connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
