import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getTopUsers, updateUserScore, addXP } from '../services/leaderboardService';

const MOCK_BADGES = [
  { id: 1, icon: '🌉', name: 'Bridge Explorer', earned: true },
  { id: 2, icon: '🌿', name: 'Eco Warrior', earned: true },
  { id: 3, icon: '📚', name: 'History Buff', earned: false },
  { id: 4, icon: '⭐', name: 'Bega Legend', earned: false },
];

// Current user ID (in real app, this comes from authentication)
const CURRENT_USER_ID = 'user_bogdan';

export default function ProfileScreen({ navigation }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Initialize current user if doesn't exist
    initializeUser();

    // Listen to leaderboard changes
    const unsubscribe = getTopUsers(10, (users) => {
      setLeaderboard(users);
      
      // Find current user in leaderboard
      const user = users.find(u => u.id === CURRENT_USER_ID);
      if (user) {
        setCurrentUser(user);
      }
      
      setLoading(false);
    });

    // Cleanup listener
    return () => unsubscribe && unsubscribe();
  }, []);

  const initializeUser = async () => {
    // Add current user to Firebase if not exists
    await updateUserScore(CURRENT_USER_ID, {
      name: 'Bogdan Fona',
      xp: 850,
      level: 5,
      avatar: '🧑',
    });
  };

  const handleAddXP = async () => {
    const result = await addXP(CURRENT_USER_ID, 50);
    if (result.success) {
      alert(`+50 XP! You now have ${result.newXP} XP (Level ${result.newLevel})`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077BE" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{currentUser?.avatar || '🧑'}</Text>
        </View>
        <Text style={styles.username}>{currentUser?.name || 'Bogdan Fona'}</Text>
        <Text style={styles.level}>Level {currentUser?.level || 5} Explorer</Text>
      </View>

      <View style={styles.content}>
        {/* Stats Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser?.xp || 850}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Quests Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Level Progress</Text>
          <View style={styles.xpContainer}>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${((currentUser?.xp || 850) % 100)}%` }]} />
            </View>
            <Text style={styles.xpText}>
              {currentUser?.xp || 850} / {((currentUser?.level || 5) * 100)} XP to Level {(currentUser?.level || 5) + 1}
            </Text>
          </View>
          
          {/* Test Button */}
          <TouchableOpacity style={styles.addXPButton} onPress={handleAddXP}>
            <Text style={styles.addXPText}>🎉 +50 XP (Test)</Text>
          </TouchableOpacity>
        </View>

        {/* Badges */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesGrid}>
            {MOCK_BADGES.map((badge) => (
              <View 
                key={badge.id} 
                style={[
                  styles.badge,
                  !badge.earned && styles.badgeLocked
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* REAL-TIME LEADERBOARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏆 Live Leaderboard</Text>
          <Text style={styles.liveIndicator}>🔴 Live updates</Text>
          
          {leaderboard.map((user) => (
            <View 
              key={user.id} 
              style={[
                styles.leaderboardItem,
                user.id === CURRENT_USER_ID && styles.currentUserItem
              ]}
            >
              <Text style={styles.rank}>#{user.rank}</Text>
              <Text style={styles.userAvatar}>{user.avatar}</Text>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.name} {user.id === CURRENT_USER_ID && '(You)'}
                </Text>
                <Text style={styles.userLevel}>Level {user.level}</Text>
              </View>
              <Text style={styles.userXP}>{user.xp} XP</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0077BE',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatar: {
    fontSize: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  level: {
    fontSize: 14,
    color: '#FFB74D',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  liveIndicator: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077BE',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  xpContainer: {
    marginTop: 10,
  },
  xpBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  xpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  addXPButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  addXPText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badge: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  badgeLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  currentUserItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#0077BE',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077BE',
    width: 40,
  },
  userAvatar: {
    fontSize: 30,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  userLevel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userXP: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  backButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
});