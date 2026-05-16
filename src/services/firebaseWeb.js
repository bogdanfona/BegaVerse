// ===========================
// BegaVerse — Firebase REST
// Reads quests & wallet from the same Firebase Realtime DB
// used by the mobile app — no SDK required, plain fetch().
// When the teammate's DB is ready, swap BASE_URL below.
// ===========================

(function () {
  const BASE_URL = 'https://begaverse-3d016-default-rtdb.europe-west1.firebasedatabase.app';

  async function fbGet(path) {
    const res = await fetch(BASE_URL + '/' + path + '.json');
    if (!res.ok) throw new Error('Firebase GET ' + path + ' failed: ' + res.status);
    return res.json();
  }

  async function fetchQuestDefinitions() {
    try {
      const data = await fbGet('quests');
      if (!data) return [];
      return Object.values(data);
    } catch (e) {
      console.warn('fetchQuestDefinitions error:', e);
      return [];
    }
  }

  async function fetchUserQuestProgress(userId) {
    try {
      const data = await fbGet('users/' + userId + '/questProgress');
      return data || {};
    } catch (e) {
      console.warn('fetchUserQuestProgress error:', e);
      return {};
    }
  }

  async function fetchWalletBalance(userId) {
    try {
      const data = await fbGet('users/' + userId + '/wallet');
      return data ? (data.points != null ? data.points : 5000) : 5000;
    } catch (e) {
      console.warn('fetchWalletBalance error:', e);
      return 5000;
    }
  }

  async function fetchLeaderboard() {
    try {
      const data = await fbGet('leaderboard');
      if (!data) return [];
      return Object.entries(data)
        .map(function (entry) { return Object.assign({ id: entry[0] }, entry[1]); })
        .sort(function (a, b) { return b.xp - a.xp; })
        .map(function (u, i) { return Object.assign({}, u, { rank: i + 1 }); });
    } catch (e) {
      console.warn('fetchLeaderboard error:', e);
      return [];
    }
  }

  window.BegaFirebase = {
    fetchQuestDefinitions: fetchQuestDefinitions,
    fetchUserQuestProgress: fetchUserQuestProgress,
    fetchWalletBalance: fetchWalletBalance,
    fetchLeaderboard: fetchLeaderboard,
  };
})();
