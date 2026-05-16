 const express = require('express');
const router = express.Router();
const { saveSensorData, getRecentSensorData } = require('../config/firebase');

// POST /api/sensor/data
router.post('/data', async (req, res) => {
  try {
    const { temperature, ph, pollution, turbidity, location } = req.body;
    
    if (temperature === undefined || ph === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required sensor data'
      });
    }
    
    const sensorData = {
      temperature: parseFloat(temperature),
      ph: parseFloat(ph),
      pollution: pollution || 'unknown',
      turbidity: turbidity ? parseFloat(turbidity) : null,
      location: location || 'Bega River - Main',
      sensorId: req.body.sensorId || 'esp32_01'
    };
    
    const result = await saveSensorData(sensorData);
    
    console.log('📊 Sensor data saved:', sensorData);
    
    res.json({
      success: true,
      message: 'Sensor data received and saved',
      timestamp: result.timestamp,
      data: sensorData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/sensor/recent
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await getRecentSensorData(limit);
    
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
