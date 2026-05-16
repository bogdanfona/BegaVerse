import { database } from './firebase';
import { ref, get, set, update, onValue } from 'firebase/database';

const STARTING_BALANCE = 5000;

// Initialize wallet for a new user (only sets if not already set)
export const initWallet = async (userId) => {
  try {
    const walletRef = ref(database, `users/${userId}/wallet`);
    const snapshot = await get(walletRef);
    if (!snapshot.exists()) {
      await set(walletRef, {
        points: STARTING_BALANCE,
        lastUpdated: Date.now(),
      });
      return { success: true, points: STARTING_BALANCE, isNew: true };
    }
    return { success: true, points: snapshot.val().points, isNew: false };
  } catch (error) {
    console.error('Error initializing wallet:', error);
    return { success: false, error };
  }
};

// Get current points balance (one-time read)
export const getBalance = async (userId) => {
  try {
    const walletRef = ref(database, `users/${userId}/wallet`);
    const snapshot = await get(walletRef);
    if (snapshot.exists()) {
      return { success: true, points: snapshot.val().points };
    }
    // Auto-init if wallet missing
    return initWallet(userId);
  } catch (error) {
    console.error('Error getting balance:', error);
    return { success: false, error };
  }
};

// Real-time listener for points balance
export const watchBalance = (userId, callback) => {
  const walletRef = ref(database, `users/${userId}/wallet`);
  return onValue(walletRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val().points);
    } else {
      callback(STARTING_BALANCE);
    }
  });
};

// Add points to wallet (quest rewards, etc.)
export const addPoints = async (userId, amount, reason = '') => {
  try {
    const walletRef = ref(database, `users/${userId}/wallet`);
    const snapshot = await get(walletRef);

    const currentPoints = snapshot.exists() ? (snapshot.val().points || 0) : STARTING_BALANCE;
    const newPoints = currentPoints + amount;

    await update(walletRef, {
      points: newPoints,
      lastUpdated: Date.now(),
    });

    return { success: true, newPoints, added: amount };
  } catch (error) {
    console.error('Error adding points:', error);
    return { success: false, error };
  }
};

// Spend points (for AR shop purchases)
export const spendPoints = async (userId, amount) => {
  try {
    const walletRef = ref(database, `users/${userId}/wallet`);
    const snapshot = await get(walletRef);

    if (!snapshot.exists()) {
      await initWallet(userId);
      return { success: false, message: 'Wallet initialized, please retry' };
    }

    const currentPoints = snapshot.val().points || 0;
    if (currentPoints < amount) {
      return { success: false, message: 'Insufficient points', currentPoints };
    }

    const newPoints = currentPoints - amount;
    await update(walletRef, {
      points: newPoints,
      lastUpdated: Date.now(),
    });

    return { success: true, newPoints, spent: amount };
  } catch (error) {
    console.error('Error spending points:', error);
    return { success: false, error };
  }
};
