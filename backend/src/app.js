const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');

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

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SIMRS Backend is running' });
});

// Public routes (no auth required)
app.use('/api/auth', require('./routes/authRoutes'));

// Protected routes (auth required)
app.use('/api/dashboard', authMiddleware, require('./routes/dashboardRoutes'));
app.use('/api/patients', authMiddleware, require('./routes/patientRoutes'));
app.use('/api/doctors', authMiddleware, require('./routes/doctorRoutes'));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
