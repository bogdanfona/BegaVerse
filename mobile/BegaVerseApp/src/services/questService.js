import { database } from './firebase';
import { ref, get, set, update, onValue } from 'firebase/database';
import { addPoints } from './walletService';

// ── Quest definitions (shared across all users and both platforms) ────────────
// These live in Firebase at quests/ so the teammate's DB can take over later.
// On first run, seedQuests() writes them if they don't exist.
export const QUEST_DEFINITIONS = [
  {
    id: 'bridge_explorer',
    title: 'Bridge Explorer',
    description: 'Visit all 6 bridges along Bega River',
    icon: '🌉',
    reward: 300,
    maxProgress: 6,
    category: 'exploration',
  },
  {
    id: 'eco_warrior',
    title: 'Eco Warrior',
    description: 'Report 5 pollution incidents',
    icon: '🌿',
    reward: 450,
    maxProgress: 5,
    category: 'reporting',
  },
  {
    id: 'history_buff',
    title: 'History Buff',
    description: 'Scan 10 historical QR locations',
    icon: '📚',
    reward: 600,
    maxProgress: 10,
    category: 'discovery',
  },
  {
    id: 'water_guardian',
    title: 'Water Guardian',
    description: 'Check sensor data 7 days in a row',
    icon: '💧',
    reward: 350,
    maxProgress: 7,
    category: 'monitoring',
  },
  {
    id: 'bega_legend',
    title: 'Bega Legend',
    description: 'Complete all other quests',
    icon: '⭐',
    reward: 1000,
    maxProgress: 4,
    category: 'milestone',
  },
];

// Seed quest definitions into Firebase if they don't exist yet
export const seedQuests = async () => {
  try {
    const questsRef = ref(database, 'quests');
    const snapshot = await get(questsRef);
    if (!snapshot.exists()) {
      const questMap = {};
      QUEST_DEFINITIONS.forEach(q => { questMap[q.id] = q; });
      await set(questsRef, questMap);
    }
    return { success: true };
  } catch (error) {
    console.error('Error seeding quests:', error);
    return { success: false, error };
  }
};

// Get all quest definitions from Firebase
export const getQuestDefinitions = async () => {
  try {
    const snapshot = await get(ref(database, 'quests'));
    if (snapshot.exists()) {
      return { success: true, quests: Object.values(snapshot.val()) };
    }
    // Fall back to local definitions if Firebase unavailable
    return { success: true, quests: QUEST_DEFINITIONS };
  } catch (error) {
    console.error('Error fetching quest definitions:', error);
    return { success: true, quests: QUEST_DEFINITIONS };
  }
};

// Get a user's progress on all quests (one-time read)
export const getUserQuestProgress = async (userId) => {
  try {
    const snapshot = await get(ref(database, `users/${userId}/questProgress`));
    return { success: true, progress: snapshot.exists() ? snapshot.val() : {} };
  } catch (error) {
    console.error('Error fetching quest progress:', error);
    return { success: false, progress: {}, error };
  }
};

// Real-time listener for a user's quest progress
export const watchQuestProgress = (userId, callback) => {
  const progressRef = ref(database, `users/${userId}/questProgress`);
  return onValue(progressRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
};

// Increment progress on a specific quest by `amount` (default 1)
export const incrementQuestProgress = async (userId, questId, amount = 1) => {
  try {
    const quest = QUEST_DEFINITIONS.find(q => q.id === questId);
    if (!quest) return { success: false, message: 'Quest not found' };

    const progressRef = ref(database, `users/${userId}/questProgress/${questId}`);
    const snapshot = await get(progressRef);

    const current = snapshot.exists() ? snapshot.val() : { progress: 0, completed: false };

    if (current.completed) {
      return { success: true, alreadyCompleted: true };
    }

    const newProgress = Math.min((current.progress || 0) + amount, quest.maxProgress);
    const justCompleted = newProgress >= quest.maxProgress;

    await update(progressRef, {
      progress: newProgress,
      completed: justCompleted,
      ...(justCompleted ? { completedAt: Date.now() } : {}),
    });

    // Award points when quest is completed
    if (justCompleted) {
      await addPoints(userId, quest.reward, `Quest completed: ${quest.title}`);
      await _checkBegaLegend(userId);
      return { success: true, newProgress, justCompleted: true, pointsAwarded: quest.reward };
    }

    return { success: true, newProgress, justCompleted: false };
  } catch (error) {
    console.error('Error incrementing quest progress:', error);
    return { success: false, error };
  }
};

// Check if all other quests are done and unlock Bega Legend
async function _checkBegaLegend(userId) {
  try {
    const snapshot = await get(ref(database, `users/${userId}/questProgress`));
    const progress = snapshot.exists() ? snapshot.val() : {};
    const otherQuests = QUEST_DEFINITIONS.filter(q => q.id !== 'bega_legend');
    const allDone = otherQuests.every(q => progress[q.id]?.completed);
    if (allDone) {
      const completedCount = otherQuests.length;
      await update(ref(database, `users/${userId}/questProgress/bega_legend`), {
        progress: completedCount,
        completed: true,
        completedAt: Date.now(),
      });
      await addPoints(userId, 1000, 'Quest completed: Bega Legend');
    }
  } catch (_) {}
}

// Get summary stats for a user (active, completed, total points earned from quests)
export const getQuestStats = async (userId) => {
  try {
    const [defsResult, progressResult] = await Promise.all([
      getQuestDefinitions(),
      getUserQuestProgress(userId),
    ]);

    const quests = defsResult.quests;
    const progress = progressResult.progress;

    let active = 0;
    let completed = 0;
    let pointsEarned = 0;

    quests.forEach(q => {
      const p = progress[q.id];
      if (p?.completed) {
        completed++;
        pointsEarned += q.reward;
      } else if (p?.progress > 0) {
        active++;
      }
    });

    return { success: true, active, completed, pointsEarned };
  } catch (error) {
    console.error('Error getting quest stats:', error);
    return { success: false, active: 0, completed: 0, pointsEarned: 0 };
  }
};
