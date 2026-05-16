 const express = require('express');
const router = express.Router();
const { updateUserXP } = require('../config/firebase');

// POST /api/quest/complete
router.post('/complete', async (req, res) => {
  try {
    const { userId, questId, xpEarned } = req.body;
    
    if (!userId || !questId || !xpEarned) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const result = await updateUserXP(userId, parseInt(xpEarned));
    
    console.log(`🎯 Quest completed: ${questId} by ${userId}`);
    
    res.json({
      success: true,
      message: 'Quest completed',
      newXP: result.xp,
      newLevel: result.level
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
