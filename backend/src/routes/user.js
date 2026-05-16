 const express = require('express');
const router = express.Router();
const { getUser, updateUserXP } = require('../config/firebase');

// GET /api/user/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { id: userId, ...user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
