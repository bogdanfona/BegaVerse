import { database } from './firebase';
import { ref, set, get, update, onValue, query, orderByChild, limitToLast } from 'firebase/database';

// Add or update user in leaderboard
export const updateUserScore = async (userId, userData) => {
  try {
    const userRef = ref(database, `leaderboard/${userId}`);
    await set(userRef, {
      name: userData.name,
      xp: userData.xp,
      level: userData.level,
      avatar: userData.avatar || '🧑',
      lastUpdated: Date.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user score:', error);
    return { success: false, error };
  }
};

// Get top users (leaderboard)
export const getTopUsers = (limit = 10, callback) => {
  const leaderboardRef = query(
    ref(database, 'leaderboard'),
    orderByChild('xp'),
    limitToLast(limit)
  );

  // Real-time listener
  return onValue(leaderboardRef, (snapshot) => {
    const users = [];
    snapshot.forEach((childSnapshot) => {
      users.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });
    
    // Sort by XP descending
    users.sort((a, b) => b.xp - a.xp);
    
    // Add rank
    const rankedUsers = users.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
    
    callback(rankedUsers);
  });
};

// Get specific user data
export const getUserData = async (userId) => {
  try {
    const userRef = ref(database, `leaderboard/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    } else {
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return { success: false, error };
  }
};

// Add XP to user
export const addXP = async (userId, xpToAdd) => {
  try {
    const userRef = ref(database, `leaderboard/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const currentData = snapshot.val();
      const newXP = (currentData.xp || 0) + xpToAdd;
      const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level
      
      await update(userRef, {
        xp: newXP,
        level: newLevel,
        lastUpdated: Date.now(),
      });
      
      return { success: true, newXP, newLevel };
    } else {
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    console.error('Error adding XP:', error);
    return { success: false, error };
  }
}; 
