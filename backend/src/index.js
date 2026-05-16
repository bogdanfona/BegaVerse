const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🌊 BegaVerse API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      leaderboard: '/api/leaderboard',
      sensorData: 'POST /api/sensor-data',
      questComplete: 'POST /api/quest/complete',
      user: '/api/user/:userId'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Import Firebase routes
const leaderboardRoutes = require('./routes/leaderboard');
const sensorRoutes = require('./routes/sensor');
const questRoutes = require('./routes/quests');
const userRoutes = require('./routes/user');

// Use routes
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/sensor', sensorRoutes);
app.use('/api/quest', questRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`   BegaVerse Backend Server`);
  console.log('   ================================');
  console.log(`   📡 Running on: http://localhost:${PORT}`);
  console.log(`   🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`   📊 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  console.log(`   🌡️  Sensor: POST http://localhost:${PORT}/api/sensor/data`);
  console.log('   ================================\n');
});

module.exports = app;