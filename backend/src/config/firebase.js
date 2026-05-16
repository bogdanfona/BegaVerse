const admin = require('firebase-admin');
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "begaverse",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://begaverse-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase Admin (without service account for now)
// For production, you'd use a service account key
try {
  admin.initializeApp({
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

// Get database reference
const db = admin.database();

// Database helper functions
const firebaseHelpers = {
  // Get leaderboard
  async getLeaderboard(limit = 10) {
    try {
      const snapshot = await db.ref('leaderboard')
        .orderByChild('xp')
        .limitToLast(limit)
        .once('value');
      
      const data = snapshot.val();
      if (!data) return [];
      
      // Convert to array and sort by XP descending
      const users = Object.entries(data).map(([id, user]) => ({
        id,
        ...user
      }));
      
      return users.sort((a, b) => b.xp - a.xp);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  },

  // Get user data
  async getUser(userId) {
    try {
      const snapshot = await db.ref(`leaderboard/${userId}`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Update user XP
  async updateUserXP(userId, xpToAdd) {
    try {
      const userRef = db.ref(`leaderboard/${userId}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();
      
      if (!userData) {
        throw new Error('User not found');
      }
      
      const newXP = (userData.xp || 0) + xpToAdd;
      const newLevel = Math.floor(newXP / 100);
      
      await userRef.update({
        xp: newXP,
        level: newLevel,
        lastUpdated: Date.now()
      });
      
      return { xp: newXP, level: newLevel };
    } catch (error) {
      console.error('Error updating user XP:', error);
      throw error;
    }
  },

  // Save sensor data
  async saveSensorData(sensorData) {
    try {
      const timestamp = Date.now();
      const dataRef = db.ref(`iot_data/${timestamp}`);
      
      await dataRef.set({
        ...sensorData,
        timestamp,
        createdAt: new Date().toISOString()
      });
      
      return { success: true, timestamp };
    } catch (error) {
      console.error('Error saving sensor data:', error);
      throw error;
    }
  },

  // Get recent sensor data
  async getRecentSensorData(limit = 20) {
    try {
      const snapshot = await db.ref('iot_data')
        .orderByKey()
        .limitToLast(limit)
        .once('value');
      
      const data = snapshot.val();
      if (!data) return [];
      
      return Object.entries(data).map(([id, reading]) => ({
        id,
        ...reading
      }));
    } catch (error) {
      console.error('Error getting sensor data:', error);
      throw error;
    }
  }
};

module.exports = { 
  admin, 
  db,
  ...firebaseHelpers 
};