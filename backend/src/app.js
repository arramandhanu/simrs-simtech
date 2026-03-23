const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');
const { requireRole, ROLES } = require('./middleware/authMiddleware');

// CORS Configuration - Restrict to frontend origin only
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
const logFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :method :url :status :response-time ms'
  : 'dev';
app.use(morgan(logFormat));

// Custom request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SIMRS Backend is running' });
});

// Public routes (no auth required)
app.use('/api/auth', require('./routes/authRoutes'));

// Protected routes (auth required for all, role-specific permissions in route handlers)
// All users can access dashboard
app.use('/api/dashboard', authMiddleware, require('./routes/dashboardRoutes'));

// Patients: All authenticated users can view, only staff+ can modify
app.use('/api/patients', authMiddleware, require('./routes/patientRoutes'));

// Doctors: Admin/Staff can manage, Doctors can view
app.use('/api/doctors', authMiddleware, require('./routes/doctorRoutes'));

// Spesialis: All authenticated users can view
app.use('/api/spesialis', authMiddleware, require('./routes/spesialisRoutes'));
app.use('/api/kredensial', authMiddleware, require('./routes/kredensialRoutes'));

// Users: Admin only (role check is inside userRoutes)
app.use('/api/users', authMiddleware, require('./routes/userRoutes'));

// Settings: All authenticated users (role check inside for hospital settings)
app.use('/api/settings', require('./routes/settingsRoutes'));

// Static file serving for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Start Server with WebSocket support
const http = require('http');
const { createWebSocketServer } = require('./services/websocketService');

const server = http.createServer(app);
createWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
