import React, { useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BegaColors, BegaCardShadow } from '../../constants/theme';

const MOCK_QUESTS = [
  { id: 1, title: 'Bridge Explorer', description: 'Visit all 6 bridges along Bega River',   progress: 3, total: 6,  xp: 100 },
  { id: 2, title: 'Eco Warrior',     description: 'Report 5 pollution incidents',            progress: 1, total: 5,  xp: 150 },
  { id: 3, title: 'History Buff',    description: 'Scan 10 historical QR locations',         progress: 7, total: 10, xp: 200 },
];

const QuestCard = ({ quest }) => {
  const pct = (quest.progress / quest.total) * 100;
  const progressAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 1000,
      delay: quest.id * 120,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.questCard}>
      <View style={styles.cardAccent} />
      <View style={styles.cardInner}>
        <View style={styles.questHeader}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{quest.xp} XP</Text>
          </View>
        </View>

        <Text style={styles.questDescription}>{quest.description}</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{quest.progress}/{quest.total}</Text>
        </View>

        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          activeOpacity={0.8}
        >
          <Text style={styles.detailBtnText}>VIEW DETAILS →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function QuestsScreen({ navigation }) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BegaColors.deep} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>3 ACTIVE</Text>
            </View>
            <Text style={styles.versionText}>QUESTS</Text>
          </View>
          <Text style={styles.title}>
            MISSION<Text style={styles.titleAccent}> BOARD</Text>
          </Text>
          <Text style={styles.subtitle}>Complete challenges · Earn XP &amp; badges</Text>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.content}>
          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: '3',   label: 'ACTIVE' },
              { value: '12',  label: 'DONE' },
              { value: '850', label: 'TOTAL XP' },
            ].map((s, i) => (
              <View
                key={i}
                style={[
                  styles.statBox,
                  i === 1 && {
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderColor: BegaColors.cardBorder,
                  },
                ]}
              >
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>// MISSION LIST</Text>
          {MOCK_QUESTS.map(q => <QuestCard key={q.id} quest={q} />)}

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
  statusDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: BegaColors.cyan, marginRight: 6,
  },
  statusText:  { color: BegaColors.cyan,     fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  versionText: { color: BegaColors.textMuted, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  title:       { fontSize: 34, fontWeight: '800', color: BegaColors.textPrimary, letterSpacing: 3 },
  titleAccent: { color: BegaColors.cyan },
  subtitle:    { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5, marginTop: 4 },
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
  statBox:    { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue:  { fontSize: 22, fontWeight: '700', color: BegaColors.cyan, fontFamily: 'monospace' },
  statLabel:  { fontSize: 9, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5, marginTop: 4 },

  sectionTitle: {
    fontSize: 11, color: BegaColors.textMuted,
    fontFamily: 'monospace', letterSpacing: 2,
    marginBottom: 14, marginLeft: 4,
  },

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
  cardAccent: { width: 3, backgroundColor: BegaColors.amber },
  cardInner:  { flex: 1, padding: 16 },

  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 15, fontWeight: '700',
    color: BegaColors.textPrimary, flex: 1, marginRight: 8,
  },
  xpBadge: {
    backgroundColor: 'rgba(192, 132, 32, 0.15)',
    borderWidth: 1, borderColor: 'rgba(192, 132, 32, 0.4)',
    borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4,
  },
  xpText: {
    fontSize: 10, fontWeight: '700',
    color: BegaColors.gold, fontFamily: 'monospace', letterSpacing: 0.5,
  },
  questDescription: {
    fontSize: 13, color: BegaColors.textMuted,
    lineHeight: 18, marginBottom: 14,
  },

  progressRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  progressTrack:  { flex: 1, height: 3, backgroundColor: BegaColors.blue, borderRadius: 2, overflow: 'hidden', marginRight: 10 },
  progressFill:   { height: '100%', backgroundColor: BegaColors.cyan, borderRadius: 2 },
  progressText:   { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace' },

  detailBtn: {
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 3, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start',
  },
  detailBtnText: { fontSize: 10, color: BegaColors.cyan, fontFamily: 'monospace', letterSpacing: 1 },

  // ── Back ────────────────────────────────────────────────
  backButton: {
    marginTop: 8,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, padding: 14, alignItems: 'center',
  },
  backButtonText: { fontSize: 11, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 1.5 },
});
