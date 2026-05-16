import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { getTopUsers, updateUserScore, addXP } from '../services/leaderboardService';
import * as Haptics from 'expo-haptics';
import { BegaColors, BegaCardShadow } from '../../constants/theme';
import { useBegaNotify } from '../components/BegaNotification';

const MOCK_BADGES = [
  { id: 1, icon: '🌉', name: 'Bridge Explorer', earned: true },
  { id: 2, icon: '🌿', name: 'Eco Warrior',     earned: true },
  { id: 3, icon: '📚', name: 'History Buff',    earned: false },
  { id: 4, icon: '⭐', name: 'Bega Legend',     earned: false },
];

const CURRENT_USER_ID = 'user_bogdan';

// ── Skeleton ─────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BegaColors.deep} />
      <View style={styles.header}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: 100 }]} />
      </View>
      <View style={styles.content}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.card, { marginBottom: 12 }]}>
            <View style={[styles.skeletonLine, { width: 120, marginBottom: 14 }]} />
            <View style={[styles.skeletonBox, { marginBottom: 8 }]} />
            <View style={styles.skeletonBox} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { showToast } = useBegaNotify();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeUser();
    const unsubscribe = getTopUsers(10, (users) => {
      setLeaderboard(users);
      const user = users.find(u => u.id === CURRENT_USER_ID);
      if (user) setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const initializeUser = async () => {
    await updateUserScore(CURRENT_USER_ID, {
      name: 'Bogdan Fona', xp: 850, level: 5, avatar: '🧑',
    });
  };

  const handleAddXP = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await addXP(CURRENT_USER_ID, 50);
    if (result.success) {
      showToast(`+50 XP · Now at ${result.newXP} XP · Level ${result.newLevel}`, 'success');
    }
  };

  if (loading) return <SkeletonLoader />;

  const xp    = currentUser?.xp    || 850;
  const level = currentUser?.level || 5;
  const xpPct = (xp % 100);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BegaColors.deep} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatar}>{currentUser?.avatar || '🧑'}</Text>
          </View>
          <Text style={styles.username}>{currentUser?.name || 'Bogdan Fona'}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL {level} · EXPLORER</Text>
          </View>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.content}>

          {/* Stats */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>// STATS OVERVIEW</Text>
            <View style={styles.statsGrid}>
              {[
                { value: xp,   label: 'TOTAL XP' },
                { value: 12,   label: 'QUESTS DONE' },
                { value: 8,    label: 'LOCATIONS' },
                { value: 2,    label: 'BADGES' },
              ].map((s, i) => (
                <View key={i} style={styles.statCell}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>// LEVEL PROGRESS</Text>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpPct}%` }]} />
            </View>
            <Text style={styles.xpInfo}>
              {xp} / {level * 100} XP → Level {level + 1}
            </Text>
            <TouchableOpacity style={styles.addXPBtn} onPress={handleAddXP} activeOpacity={0.8}>
              <Text style={styles.addXPText}>+ ADD 50 XP (TEST)</Text>
            </TouchableOpacity>
          </View>

          {/* Badges */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>// BADGES</Text>
            <View style={styles.badgesGrid}>
              {MOCK_BADGES.map(badge => (
                <TouchableOpacity
                  key={badge.id}
                  style={[styles.badgeCell, !badge.earned && styles.badgeLocked]}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  {!badge.earned && <Text style={styles.badgeLockTag}>LOCKED</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Leaderboard */}
          <View style={[styles.card, { borderLeftColor: BegaColors.gold }]}>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.sectionLabel}>// LIVE LEADERBOARD</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {leaderboard.map(user => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.leaderRow,
                  user.id === CURRENT_USER_ID && styles.leaderRowActive,
                ]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                activeOpacity={0.8}
              >
                <Text style={styles.rank}>#{user.rank}</Text>
                <Text style={styles.userAvatar}>{user.avatar}</Text>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.name}{user.id === CURRENT_USER_ID ? ' (You)' : ''}
                  </Text>
                  <Text style={styles.userLevel}>LVL {user.level}</Text>
                </View>
                <Text style={styles.userXP}>{user.xp} XP</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>← BACK TO HOME</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BegaColors.deep },

  // ── Header ──────────────────────────────────────────────
  header: {
    backgroundColor: BegaColors.navy,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BegaColors.cardBorder,
  },
  avatarRing: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: BegaColors.blue,
    borderWidth: 2, borderColor: BegaColors.cyan,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatar:   { fontSize: 40 },
  username: { fontSize: 22, fontWeight: '700', color: BegaColors.textPrimary, letterSpacing: 0.5, marginBottom: 10 },
  levelBadge: {
    backgroundColor: 'rgba(36, 118, 181, 0.12)',
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: 5,
  },
  levelText: { color: BegaColors.cyan, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1.5 },
  headerDivider: { height: 1, backgroundColor: BegaColors.cardBorder, marginTop: 20, width: '100%' },

  // ── Content ─────────────────────────────────────────────
  content: { padding: 20 },

  card: {
    backgroundColor: BegaColors.cardBg,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderLeftWidth: 3, borderLeftColor: BegaColors.cyan,
    borderRadius: 4, padding: 18, marginBottom: 14,
    ...BegaCardShadow,
  },
  sectionLabel: {
    fontSize: 10, color: BegaColors.textMuted,
    fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14,
  },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCell: {
    width: '48%', backgroundColor: BegaColors.blue,
    borderRadius: 3, padding: 14, marginBottom: 10, alignItems: 'center',
    borderWidth: 1, borderColor: BegaColors.cardBorder,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: BegaColors.cyan, fontFamily: 'monospace' },
  statLabel: { fontSize: 9, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5, marginTop: 4 },

  // XP
  xpTrack: {
    height: 4, backgroundColor: BegaColors.blue,
    borderRadius: 2, overflow: 'hidden', marginBottom: 10,
  },
  xpFill:  { height: '100%', backgroundColor: BegaColors.cyan, borderRadius: 2 },
  xpInfo:  { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace', textAlign: 'center', marginBottom: 16 },
  addXPBtn: {
    backgroundColor: BegaColors.cyan, borderRadius: 3, padding: 12, alignItems: 'center',
  },
  addXPText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },

  // Badges
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeCell: {
    width: '48%', backgroundColor: BegaColors.blue,
    borderRadius: 3, padding: 14, marginBottom: 10, alignItems: 'center',
    borderWidth: 1, borderColor: BegaColors.cardBorder,
  },
  badgeLocked: { opacity: 0.3 },
  badgeIcon:   { fontSize: 36, marginBottom: 8 },
  badgeName:   { fontSize: 11, color: BegaColors.textMuted, textAlign: 'center', fontFamily: 'monospace' },
  badgeLockTag: { fontSize: 9, color: BegaColors.coral, fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 },

  // Leaderboard
  leaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  livePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(102, 187, 106, 0.12)',
    borderWidth: 1, borderColor: 'rgba(102, 187, 106, 0.35)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BegaColors.greenBright, marginRight: 5 },
  liveText: { color: BegaColors.greenBright, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 },

  leaderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BegaColors.blue,
    borderRadius: 3, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
  },
  leaderRowActive: {
    borderColor: BegaColors.cyan,
    backgroundColor: 'rgba(36, 118, 181, 0.12)',
  },
  rank:       { fontSize: 13, fontWeight: '700', color: BegaColors.cyan, fontFamily: 'monospace', width: 36 },
  userAvatar: { fontSize: 26, marginRight: 10 },
  userInfo:   { flex: 1 },
  userName:   { fontSize: 14, color: BegaColors.textPrimary, fontWeight: '600' },
  userLevel:  { fontSize: 10, color: BegaColors.textMuted, fontFamily: 'monospace', marginTop: 2 },
  userXP:     { fontSize: 12, fontWeight: '700', color: BegaColors.greenBright, fontFamily: 'monospace' },

  // Back
  backButton: {
    marginTop: 8, borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, padding: 14, alignItems: 'center',
  },
  backButtonText: { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5 },

  // Skeleton
  skeletonAvatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(36, 118, 181, 0.15)', marginBottom: 14,
  },
  skeletonLine: {
    width: 150, height: 16,
    backgroundColor: 'rgba(36, 118, 181, 0.12)',
    borderRadius: 3, marginBottom: 8,
  },
  skeletonBox: {
    width: '100%', height: 56,
    backgroundColor: BegaColors.blue,
    borderRadius: 3,
  },
});
