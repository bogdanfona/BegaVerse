import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, Image, ScrollView,
  TouchableOpacity, Dimensions, Animated, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import * as Speech from 'expo-speech';
import { BegaColors, BegaCardShadow } from '../../constants/theme';
import { useBegaNotify } from '../components/BegaNotification';

const { width, height } = Dimensions.get('window');

const MOCK_AR_CONTENT = {
  'Podul Michelangelo': {
    title: 'Michelangelo Bridge',
    year: '1901',
    image: 'https://picsum.photos/400/600?random=1',
    facts: [
      'Built in 1901 during Habsburg Empire',
      'Named after Italian Renaissance artist',
      'Connects Fabric district to city center',
      'Renovated in 2010 for modern traffic',
    ],
    story: 'This historic bridge was constructed at the dawn of the 20th century, serving as a vital connection between the industrial Fabric district and the city center. The bridge witnessed the transformation of Timișoara from an industrial powerhouse to a modern European city.',
  },
  'Bega River Center': {
    title: 'Bega River Historic Center',
    year: '1760',
    image: 'https://picsum.photos/400/600?random=2',
    facts: [
      'Canal built in 1760 to prevent flooding',
      'Used for trade transport until 1950s',
      'Home to diverse aquatic ecosystem',
      'UNESCO heritage site candidate',
    ],
    story: 'The Bega Canal was engineered in the 18th century to tame the wild Bega River. It became a crucial trade route, bringing prosperity to Timișoara. Today, it serves as a green corridor through the city.',
  },
  default: {
    title: 'Bega River Discovery',
    year: '2024',
    image: 'https://picsum.photos/400/600?random=3',
    facts: [
      'Bega River spans 254 km through Romania',
      'Flows through Timișoara for 13 km',
      'Home to 15+ fish species',
      'Part of Danube river basin',
    ],
    story: "The Bega River has been the lifeline of Timișoara for centuries. From a wild river to a regulated canal, it has shaped the city's history, economy, and culture.",
  },
};

export default function ARContentScreen({ route, navigation }) {
  const { showToast, showDialog } = useBegaNotify();
  const { qrData } = route.params || {};
  const content = MOCK_AR_CONTENT[qrData] || MOCK_AR_CONTENT['default'];

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const viewRef   = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    return () => { if (isSpeaking) Speech.stop(); };
  }, [isSpeaking]);

  // ── Photo ──────────────────────────────────────────────
  const takeARPhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(viewRef, { format: 'png', quality: 1 });
      const filename = `BegaVerse_${Date.now()}.png`;
      const newUri   = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({ from: uri, to: newUri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      showDialog({
        title: 'PHOTO CAPTURED',
        message: 'Your AR photo is saved. What would you like to do?',
        type: 'success',
        buttons: [
          { text: 'CLOSE', style: 'cancel' },
          {
            text: 'SHARE',
            onPress: async () => {
              try {
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                  await Sharing.shareAsync(newUri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share BegaVerse AR Photo',
                    UTI: 'public.png',
                  });
                } else {
                  showToast('Sharing not available on this device.', 'warning');
                }
              } catch {
                showToast('Could not share photo.', 'error');
              }
            },
          },
        ],
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog({
        title: 'CAPTURE FAILED',
        message: error.message,
        type: 'error',
        buttons: [{ text: 'OK' }],
      });
    }
  };

  // ── Audio ──────────────────────────────────────────────
  const playAudioGuide = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        showToast('Audio guide paused.', 'info');
        return;
      }
      setIsSpeaking(true);
      showToast(`Now narrating: ${content.title}`, 'info');

      Speech.speak(`${content.title}. Established in ${content.year}. ${content.story}`, {
        language: 'en-US', pitch: 1.0, rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast('Audio narration complete.', 'success');
        },
        onStopped: () => setIsSpeaking(false),
        onError:   () => {
          setIsSpeaking(false);
          showToast('Failed to play audio. Please try again.', 'error');
        },
      });
    } catch {
      setIsSpeaking(false);
      showToast('Audio guide unavailable.', 'error');
    }
  };

  // ── Map ────────────────────────────────────────────────
  const openInMap = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const lat   = 45.7489;
      const lng   = 21.2087;
      const label = encodeURIComponent(content.title);
      const url   = Platform.select({
        ios:     `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      });

      showDialog({
        title: 'OPEN IN MAPS',
        message: `Navigate to ${content.title} in your maps app?`,
        type: 'info',
        buttons: [
          { text: 'CANCEL', style: 'cancel' },
          {
            text: 'OPEN MAPS',
            onPress: async () => {
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                await Linking.openURL(url);
              } else {
                await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ],
      });
    } catch {
      showToast('Could not open maps.', 'error');
    }
  };

  const ACTIONS = [
    { key: 'photo', icon: '📸', label: 'AR PHOTO',   onPress: takeARPhoto },
    { key: 'audio', icon: isSpeaking ? '🔇' : '🔊', label: isSpeaking ? 'STOP' : 'AUDIO', onPress: playAudioGuide },
    { key: 'map',   icon: '🗺️', label: 'VIEW MAP',   onPress: openInMap },
  ];

  return (
    <Animated.View
      ref={viewRef}
      style={[styles.container, { opacity: fadeAnim }]}
      collapsable={false}
    >
      {/* Background image */}
      <Image
        source={{ uri: content.image }}
        style={styles.bgImage}
        onError={() => {}}
      />
      {/* Navy tint overlay */}
      <View style={styles.bgOverlay} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.arTag}>
            <Text style={styles.arTagText}>[ AR · ACTIVE ]</Text>
          </View>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.year}>EST. {content.year}</Text>
        </Animated.View>

        {/* Story card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.cardAccentCyan} />
          <View style={styles.cardInner}>
            <Text style={styles.cardLabel}>// HISTORICAL LOG</Text>
            <Text style={styles.storyText}>{content.story}</Text>
          </View>
        </Animated.View>

        {/* Facts card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.cardAccentCyan, { backgroundColor: BegaColors.gold }]} />
          <View style={styles.cardInner}>
            <Text style={styles.cardLabel}>// DATA POINTS</Text>
            {content.facts.map((fact, i) => (
              <View key={i} style={styles.factRow}>
                <Text style={styles.factBullet}>›</Text>
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actionsRow, { opacity: fadeAnim }]}>
          {ACTIONS.map(action => (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.actionBtn,
                action.key === 'audio' && isSpeaking && styles.actionBtnActive,
              ]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Discovery banner */}
        <Animated.View style={[styles.discoveryBanner, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
          <View style={styles.discoveryAccent} />
          <View style={styles.discoveryInner}>
            <Text style={styles.discoveryTag}>LOCATION UNLOCKED</Text>
            <Text style={styles.discoveryXP}>+50 XP EARNED</Text>
          </View>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Close button */}
      <Animated.View style={[styles.closeBtnWrap, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.goBack();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.closeBtnText}>✕ CLOSE AR VIEW</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BegaColors.deep },

  bgImage: {
    position: 'absolute', width, height, opacity: 0.28,
  },
  bgOverlay: {
    position: 'absolute', width, height,
    backgroundColor: 'rgba(3, 12, 24, 0.68)',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 20 },

  // ── Header ──────────────────────────────────────────────
  header: { alignItems: 'center', marginBottom: 24 },
  arTag: {
    borderWidth: 1, borderColor: BegaColors.cardBorderStrong,
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  arTagText: { color: BegaColors.cyan, fontSize: 11, fontFamily: 'monospace', letterSpacing: 2 },
  title: {
    fontSize: 28, fontWeight: '800', color: BegaColors.textPrimary,
    textAlign: 'center', letterSpacing: 0.5, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  year: {
    fontSize: 13, color: BegaColors.gold, fontFamily: 'monospace', letterSpacing: 2,
  },

  // ── Cards ────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: BegaColors.cardBg,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, marginBottom: 14, overflow: 'hidden',
    ...BegaCardShadow,
  },
  cardAccentCyan: { width: 3, backgroundColor: BegaColors.cyan },
  cardInner:      { flex: 1, padding: 18 },
  cardLabel:      { fontSize: 10, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 12 },
  storyText:      { fontSize: 14, color: BegaColors.textPrimary, lineHeight: 22 },
  factRow:        { flexDirection: 'row', marginBottom: 10 },
  factBullet:     { fontSize: 16, color: BegaColors.cyan, marginRight: 10, fontWeight: '700' },
  factText:       { flex: 1, fontSize: 13, color: BegaColors.textPrimary, lineHeight: 20 },

  // ── Actions ─────────────────────────────────────────────
  actionsRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  actionBtn: {
    backgroundColor: BegaColors.cardBg,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, flex: 1, marginHorizontal: 4,
    paddingVertical: 16, alignItems: 'center',
    ...BegaCardShadow,
  },
  actionBtnActive: {
    borderColor: BegaColors.cyan,
    backgroundColor: 'rgba(36, 118, 181, 0.12)',
  },
  actionIcon:  { fontSize: 26, marginBottom: 8 },
  actionLabel: { fontSize: 9, color: BegaColors.cyan, fontFamily: 'monospace', letterSpacing: 1 },

  // ── Discovery banner ─────────────────────────────────────
  discoveryBanner: {
    flexDirection: 'row',
    backgroundColor: BegaColors.cardBg,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, overflow: 'hidden', marginBottom: 14,
    ...BegaCardShadow,
  },
  discoveryAccent: { width: 3, backgroundColor: BegaColors.green },
  discoveryInner:  { flex: 1, padding: 18, alignItems: 'center' },
  discoveryTag: {
    fontSize: 12, fontWeight: '700', color: BegaColors.greenBright,
    fontFamily: 'monospace', letterSpacing: 2, marginBottom: 6,
  },
  discoveryXP: {
    fontSize: 18, fontWeight: '800', color: BegaColors.gold,
    fontFamily: 'monospace', letterSpacing: 1,
  },

  // ── Close ────────────────────────────────────────────────
  closeBtnWrap: {
    position: 'absolute', bottom: 28, left: 20, right: 20,
  },
  closeBtn: {
    borderWidth: 1, borderColor: BegaColors.cardBorderStrong,
    backgroundColor: BegaColors.navy,
    borderRadius: 4, padding: 18, alignItems: 'center',
    ...BegaCardShadow,
  },
  closeBtnText: {
    color: BegaColors.cyan, fontSize: 14, fontWeight: '700',
    fontFamily: 'monospace', letterSpacing: 2,
  },
});
