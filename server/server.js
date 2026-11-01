const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const mealRoutes = require('./routes/meals');
const userRoutes = require('./routes/users');
const geminiRoutes = require('./routes/gemini');

const app = express();

// Create uploads directory if it doesn't exist (handle Vercel environment)
const uploadsDir = process.env.VERCEL ? os.tmpdir() : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. CORS first (ensures all responses, including errors, carry CORS headers)
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 2. Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// 3. Health check route (unblocked by DB status)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 4. Database connection verification middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err.message);
    res.status(503).json({
      message: 'Database connection failed. Please verify MONGODB_URI in server/.env',
      error: err.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gemini', geminiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: 'Internal server error' });
});

// Start local server if executed directly
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`\n🚀 NutriTrack Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
    try {
      await connectDB();
    } catch (err) {
      console.warn('⚠️  MongoDB not yet connected. Will retry on incoming requests.');
    }
  });
}

module.exports = app;
