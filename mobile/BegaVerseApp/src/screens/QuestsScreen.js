import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Animated, StatusBar, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BegaColors, BegaCardShadow } from '../../constants/theme';
import { useBegaNotify } from '../components/BegaNotification';
import {
  seedQuests,
  watchQuestProgress,
  incrementQuestProgress,
  QUEST_DEFINITIONS,
} from '../services/questService';
import { watchBalance } from '../services/walletService';

const CURRENT_USER_ID = 'user_bogdan';

// ── Quest Card ────────────────────────────────────────────────────────────────

const QuestCard = ({ quest, progress, onSimulateProgress }) => {
  const current = progress?.progress || 0;
  const completed = progress?.completed || false;
  const pct = Math.min((current / quest.maxProgress) * 100, 100);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const accentColor = completed ? BegaColors.greenBright : BegaColors.amber;

  return (
    <View style={[styles.questCard, completed && styles.questCardDone]}>
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
      <View style={styles.cardInner}>

        <View style={styles.questHeader}>
          <Text style={styles.questIcon}>{quest.icon}</Text>
          <View style={styles.questTitleBlock}>
            <Text style={styles.questTitle}>{quest.title}</Text>
            <Text style={styles.questCategory}>{quest.category.toUpperCase()}</Text>
          </View>
          <View style={[styles.rewardBadge, completed && styles.rewardBadgeDone]}>
            <Text style={[styles.rewardText, completed && styles.rewardTextDone]}>
              {completed ? '✓ DONE' : `+${quest.reward} PTS`}
            </Text>
          </View>
        </View>

        <Text style={styles.questDescription}>{quest.description}</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                completed && styles.progressFillDone,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{current}/{quest.maxProgress}</Text>
        </View>

        {!completed && (
          <TouchableOpacity
            style={styles.progressBtn}
            onPress={() => onSimulateProgress(quest.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.progressBtnText}>+ LOG PROGRESS →</Text>
          </TouchableOpacity>
        )}

        {completed && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>QUEST COMPLETE · {quest.reward} PTS EARNED</Text>
          </View>
        )}

      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function QuestsScreen({ navigation }) {
  const { showToast } = useBegaNotify();

  const [questProgress, setQuestProgress] = useState({});
  const [balance, setBalance]             = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    seedQuests();

    const unsubProgress = watchQuestProgress(CURRENT_USER_ID, (progress) => {
      setQuestProgress(progress);
      setLoading(false);
    });

    const unsubBalance = watchBalance(CURRENT_USER_ID, (pts) => {
      setBalance(pts);
    });

    return () => {
      unsubProgress && unsubProgress();
      unsubBalance && unsubBalance();
    };
  }, []);

  const handleSimulateProgress = useCallback(async (questId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await incrementQuestProgress(CURRENT_USER_ID, questId);
    if (result.success) {
      if (result.alreadyCompleted) {
        showToast('Quest already completed!', 'info');
      } else if (result.justCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(`Quest complete! +${result.pointsAwarded} pts earned`, 'success');
      } else {
        showToast(`Progress logged (${result.newProgress})`, 'success');
      }
    } else {
      showToast('Failed to log progress', 'error');
    }
  }, [showToast]);

  // Derived stats
  const activeCount    = QUEST_DEFINITIONS.filter(q => !questProgress[q.id]?.completed && (questProgress[q.id]?.progress || 0) > 0).length;
  const completedCount = QUEST_DEFINITIONS.filter(q => questProgress[q.id]?.completed).length;
  const totalPtsEarned = QUEST_DEFINITIONS.filter(q => questProgress[q.id]?.completed).reduce((sum, q) => sum + q.reward, 0);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BegaColors.deep} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{activeCount} ACTIVE</Text>
            </View>
            <Text style={styles.versionText}>QUESTS</Text>
          </View>
          <Text style={styles.title}>
            MISSION<Text style={styles.titleAccent}> BOARD</Text>
          </Text>
          <Text style={styles.subtitle}>Complete challenges · Earn points &amp; badges</Text>

          {/* Wallet balance strip */}
          <View style={styles.balanceStrip}>
            <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
            <Text style={styles.balanceValue}>
              {balance !== null ? `${balance.toLocaleString()} PTS` : '—'}
            </Text>
          </View>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.content}>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { value: String(activeCount),    label: 'ACTIVE' },
              { value: String(completedCount), label: 'DONE' },
              { value: String(totalPtsEarned), label: 'PTS EARNED' },
            ].map((s, i) => (
              <View
                key={i}
                style={[
                  styles.statBox,
                  i === 1 && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: BegaColors.cardBorder },
                ]}
              >
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>// MISSION LIST</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={BegaColors.cyan} />
              <Text style={styles.loadingText}>SYNCING QUESTS...</Text>
            </View>
          ) : (
            QUEST_DEFINITIONS.map(q => (
              <QuestCard
                key={q.id}
                quest={q}
                progress={questProgress[q.id]}
                onSimulateProgress={handleSimulateProgress}
              />
            ))
          )}

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
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: BegaColors.cardBorder,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 118, 181, 0.12)',
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: BegaColors.cyan, marginRight: 6 },
  statusText:  { color: BegaColors.cyan,     fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  versionText: { color: BegaColors.textMuted, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  title:       { fontSize: 34, fontWeight: '800', color: BegaColors.textPrimary, letterSpacing: 3 },
  titleAccent: { color: BegaColors.cyan },
  subtitle:    { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5, marginTop: 4 },

  balanceStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(192, 132, 32, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 32, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  balanceLabel: { fontSize: 9, color: BegaColors.gold, fontFamily: 'monospace', letterSpacing: 2 },
  balanceValue: { fontSize: 18, fontWeight: '700', color: BegaColors.gold, fontFamily: 'monospace' },

  headerDivider: { height: 1, backgroundColor: BegaColors.cardBorder, marginTop: 20 },

  // ── Content ─────────────────────────────────────────────
  content: { padding: 20 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: BegaColors.blue,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: BegaColors.cyan,
    marginBottom: 20,
    ...BegaCardShadow,
  },
  statBox:   { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: 22, fontWeight: '700', color: BegaColors.cyan, fontFamily: 'monospace' },
  statLabel: { fontSize: 9, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5, marginTop: 4 },

  sectionTitle: {
    fontSize: 11, color: BegaColors.textMuted,
    fontFamily: 'monospace', letterSpacing: 2,
    marginBottom: 14, marginLeft: 4,
  },

  loadingBox:  { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: BegaColors.textMuted, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5 },

  // ── Quest Cards ─────────────────────────────────────────
  questCard: {
    flexDirection: 'row',
    backgroundColor: BegaColors.cardBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
    marginBottom: 12,
    overflow: 'hidden',
    ...BegaCardShadow,
  },
  questCardDone: { borderColor: 'rgba(102, 187, 106, 0.35)' },
  cardAccent:    { width: 3 },
  cardInner:     { flex: 1, padding: 16 },

  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questIcon:  { fontSize: 26, marginRight: 12 },
  questTitleBlock: { flex: 1, marginRight: 8 },
  questTitle:    { fontSize: 15, fontWeight: '700', color: BegaColors.textPrimary },
  questCategory: { fontSize: 9, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5, marginTop: 2 },

  rewardBadge: {
    backgroundColor: 'rgba(192, 132, 32, 0.15)',
    borderWidth: 1, borderColor: 'rgba(192, 132, 32, 0.4)',
    borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4,
  },
  rewardBadgeDone: {
    backgroundColor: 'rgba(102, 187, 106, 0.12)',
    borderColor: 'rgba(102, 187, 106, 0.4)',
  },
  rewardText:     { fontSize: 10, fontWeight: '700', color: BegaColors.gold,       fontFamily: 'monospace', letterSpacing: 0.5 },
  rewardTextDone: { color: BegaColors.greenBright },

  questDescription: { fontSize: 13, color: BegaColors.textMuted, lineHeight: 18, marginBottom: 14 },

  progressRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  progressTrack: { flex: 1, height: 3, backgroundColor: BegaColors.blue, borderRadius: 2, overflow: 'hidden', marginRight: 10 },
  progressFill:  { height: '100%', backgroundColor: BegaColors.cyan, borderRadius: 2 },
  progressFillDone: { backgroundColor: BegaColors.greenBright },
  progressText:  { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace' },

  progressBtn: {
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 3, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start',
  },
  progressBtnText: { fontSize: 10, color: BegaColors.cyan, fontFamily: 'monospace', letterSpacing: 1 },

  completedBanner: {
    backgroundColor: 'rgba(102, 187, 106, 0.08)',
    borderWidth: 1, borderColor: 'rgba(102, 187, 106, 0.25)',
    borderRadius: 3, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center',
  },
  completedText: { fontSize: 10, color: BegaColors.greenBright, fontFamily: 'monospace', letterSpacing: 1 },

  // ── Back ────────────────────────────────────────────────
  backButton: {
    marginTop: 8,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, padding: 14, alignItems: 'center',
  },
  backButtonText: { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5 },
});
