import React, { useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Animated, StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BegaColors, BegaCardShadow } from '../../constants/theme';

const NAV_ITEMS = [
  { icon: '📸', title: 'Scan QR Code',   description: 'Unlock AR content at Bega locations',        screen: 'ARCamera',    tag: 'SCAN' },
  { icon: '🎯', title: 'Active Quests',   description: 'Complete challenges and earn rewards',         screen: 'Quests',      tag: 'QUEST' },
  { icon: '👤', title: 'Your Profile',    description: 'View your level, badges and achievements',     screen: 'Profile',     tag: 'PROFILE' },
  { icon: '🌊', title: 'AR Dimension',    description: 'See Bega River in augmented reality',          screen: 'ARDimension', tag: 'AR' },
];

const AnimatedCard = ({ icon, title, description, tag, onPress, delay }) => {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1, delay, tension: 50, friction: 7, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, delay, duration: 400, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 90, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 120, useNativeDriver: true }),
    ]).start();
    setTimeout(onPress, 100);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
        <View style={styles.cardAccent} />
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{icon}</Text>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen({ navigation }) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BegaColors.deep} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SYSTEM ONLINE</Text>
            </View>
            <Text style={styles.version}>OPS v0.1</Text>
          </View>

          <Text style={styles.title}>BEGA<Text style={styles.titleAccent}>VERSE</Text></Text>
          <Text style={styles.subtitle}>Digital Twin · Bega River</Text>

          <View style={styles.headerDivider} />
        </View>

        {/* Stats Bar */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>850</Text>
            <Text style={styles.statLabel}>XP POINTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>LVL 5</Text>
            <Text style={styles.statLabel}>EXPLORER</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>3/10</Text>
            <Text style={styles.statLabel}>QUESTS</Text>
          </View>
        </View>

        {/* Nav Cards */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>// EXPLORE BEGA</Text>

          {NAV_ITEMS.map((item, i) => (
            <AnimatedCard
              key={item.screen}
              icon={item.icon}
              title={item.title}
              description={item.description}
              tag={item.tag}
              onPress={() => navigation.navigate(item.screen)}
              delay={i * 80}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>HACKTM 2025 · BEGA RIVER DIGITAL TWIN</Text>
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BegaColors.deep,
  },

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
    backgroundColor: 'rgba(91, 138, 53, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(91, 138, 53, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BegaColors.greenBright,
    marginRight: 6,
  },
  statusText: {
    color: BegaColors.greenBright,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  version: {
    color: BegaColors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: BegaColors.textPrimary,
    letterSpacing: 4,
  },
  titleAccent: {
    color: BegaColors.cyan,
  },
  subtitle: {
    fontSize: 12,
    color: BegaColors.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginTop: 4,
  },
  headerDivider: {
    height: 1,
    backgroundColor: BegaColors.cardBorder,
    marginTop: 20,
  },

  // ── Stats ────────────────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: BegaColors.blue,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: BegaColors.cyan,
    ...BegaCardShadow,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statDivider: {
    width: 1,
    backgroundColor: BegaColors.cardBorder,
    marginVertical: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BegaColors.cyan,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 9,
    color: BegaColors.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    marginTop: 4,
  },

  // ── Cards ────────────────────────────────────────────────
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    color: BegaColors.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: BegaColors.cardBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
    marginBottom: 12,
    overflow: 'hidden',
    ...BegaCardShadow,
  },
  cardAccent: {
    width: 3,
    backgroundColor: BegaColors.cyan,
  },
  cardInner: {
    flex: 1,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 28,
  },
  tagBadge: {
    backgroundColor: 'rgba(36, 118, 181, 0.12)',
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: BegaColors.textMuted,
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BegaColors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: BegaColors.textMuted,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  cardArrow: {
    color: BegaColors.cyan,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Footer ───────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: BegaColors.cardBorder,
    marginTop: 8,
    marginHorizontal: 20,
  },
  footerText: {
    color: 'rgba(123, 175, 212, 0.4)',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
});
