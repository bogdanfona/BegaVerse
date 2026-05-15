import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

const MOCK_BADGES = [
  { id: 1, icon: '🌉', name: 'Bridge Explorer', earned: true },
  { id: 2, icon: '🌿', name: 'Eco Warrior', earned: true },
  { id: 3, icon: '📚', name: 'History Buff', earned: false },
  { id: 4, icon: '⭐', name: 'Bega Legend', earned: false },
];

const LEADERBOARD = [
  { rank: 1, name: 'Ana M.', xp: 2500, avatar: '👩' },
  { rank: 2, name: 'Mihai P.', xp: 2100, avatar: '👨' },
  { rank: 3, name: 'You', xp: 850, avatar: '🧑', isCurrentUser: true },
  { rank: 4, name: 'Elena D.', xp: 720, avatar: '👧' },
  { rank: 5, name: 'Andrei T.', xp: 650, avatar: '👦' },
];

export default function ProfileScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>🧑</Text>
        </View>
        <Text style={styles.username}>Bogdan Fona</Text>
        <Text style={styles.level}>Level 5 Explorer</Text>
      </View>

      <View style={styles.content}>
        {/* Stats Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>850</Text>
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
              <View style={[styles.xpFill, { width: '65%' }]} />
            </View>
            <Text style={styles.xpText}>850 / 1000 XP to Level 6</Text>
          </View>
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

        {/* Leaderboard */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
          {LEADERBOARD.map((user) => (
            <View 
              key={user.rank} 
              style={[
                styles.leaderboardItem,
                user.isCurrentUser && styles.currentUserItem
              ]}
            >
              <Text style={styles.rank}>#{user.rank}</Text>
              <Text style={styles.userAvatar}>{user.avatar}</Text>
              <Text style={styles.userName}>{user.name}</Text>
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
  userName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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