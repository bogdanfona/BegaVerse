import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { BegaColors, BegaCardShadow } from '../../constants/theme';
import { useBegaNotify } from '../components/BegaNotification';

export default function ARCameraScreen({ navigation }) {
  const { showDialog } = useBegaNotify();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showDialog({
      title: 'AR CONTENT UNLOCKED',
      message: `Location: ${data}\n\nTap View to see the full AR experience.`,
      type: 'success',
      buttons: [
        {
          text: 'SCAN AGAIN',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
        {
          text: 'VIEW AR',
          onPress: () => {
            navigation.navigate('ARContent', { qrData: data });
            setTimeout(() => setScanned(false), 500);
          },
        },
      ],
    });
  };

  // Permissions pending
  if (!permission) {
    return (
      <View style={styles.permContainer}>
        <StatusBar barStyle="light-content" backgroundColor={BegaColors.deep} />
        <Text style={styles.permTitle}>INITIALISING SCANNER</Text>
        <Text style={styles.permSub}>Requesting camera access…</Text>
      </View>
    );
  }

  // Permissions denied
  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <StatusBar barStyle="light-content" backgroundColor={BegaColors.deep} />
        <View style={styles.permCard}>
          <View style={styles.permCardAccent} />
          <View style={styles.permCardInner}>
            <Text style={styles.permTag}>[ PERMISSION REQUIRED ]</Text>
            <Text style={styles.permTitle}>CAMERA ACCESS</Text>
            <Text style={styles.permSub}>Grant camera access to scan QR codes and unlock AR content.</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.8}>
              <Text style={styles.permBtnText}>GRANT ACCESS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permBtnGhost} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.permBtnGhostText}>← BACK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topOverlay} />

        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />

          {/* Scan frame */}
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {!scanned && (
              <Text style={styles.scanHint}>POINT AT QR CODE</Text>
            )}
          </View>

          <View style={styles.sideOverlay} />
        </View>

        <View style={styles.bottomOverlay}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>← BACK</Text>
          </TouchableOpacity>

          {scanned && (
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => setScanned(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.rescanBtnText}>SCAN AGAIN</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instrLabel}>// HOW TO USE</Text>
        <Text style={styles.instrText}>
          1. Point camera at QR code{'\n'}
          2. Wait for automatic scan{'\n'}
          3. Tap VIEW AR for content
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera:    { flex: 1 },

  // ── Overlay ─────────────────────────────────────────────
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topOverlay:  { flex: 1,  backgroundColor: 'rgba(3, 12, 24, 0.72)' },
  sideOverlay: { flex: 1,  backgroundColor: 'rgba(3, 12, 24, 0.72)' },
  middleRow:   { flexDirection: 'row', height: 250 },

  scanArea: {
    width: 250, height: 250,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  corner: {
    position: 'absolute', width: 28, height: 28,
    borderColor: BegaColors.cyan,
  },
  cornerTL: { top: 0,    left: 0,  borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0,    right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0,  borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },

  scanHint: {
    color: BegaColors.cyan, fontSize: 11,
    fontFamily: 'monospace', letterSpacing: 2,
    backgroundColor: 'rgba(3, 12, 24, 0.8)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 3,
  },

  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 12, 24, 0.72)',
    justifyContent: 'center', alignItems: 'center', paddingBottom: 100,
  },
  backBtn: {
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 3, paddingHorizontal: 28, paddingVertical: 12, marginBottom: 12,
  },
  backBtnText:   { color: BegaColors.textMuted, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1.5 },
  rescanBtn: {
    backgroundColor: BegaColors.cyan,
    borderRadius: 3, paddingHorizontal: 28, paddingVertical: 14,
  },
  rescanBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1.5 },

  // ── Instructions ────────────────────────────────────────
  instructions: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    backgroundColor: BegaColors.navy,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderLeftWidth: 3, borderLeftColor: BegaColors.cyan,
    borderRadius: 4, padding: 16,
    ...BegaCardShadow,
  },
  instrLabel: { fontSize: 10, color: BegaColors.textMuted, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 8 },
  instrText:  { fontSize: 12, color: BegaColors.textPrimary, fontFamily: 'monospace', lineHeight: 20 },

  // ── Permission screens ───────────────────────────────────
  permContainer: {
    flex: 1, backgroundColor: BegaColors.deep,
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  permCard: {
    flexDirection: 'row',
    backgroundColor: BegaColors.cardBg,
    borderWidth: 1, borderColor: BegaColors.cardBorder,
    borderRadius: 4, overflow: 'hidden', width: '100%',
    ...BegaCardShadow,
  },
  permCardAccent: { width: 3, backgroundColor: BegaColors.cyan },
  permCardInner:  { flex: 1, padding: 24, alignItems: 'center' },
  permTag: {
    color: BegaColors.textMuted, fontSize: 10, fontFamily: 'monospace',
    letterSpacing: 1.5, marginBottom: 16,
  },
  permTitle: {
    fontSize: 26, fontWeight: '800', color: BegaColors.textPrimary,
    letterSpacing: 3, marginBottom: 12, textAlign: 'center',
  },
  permSub: {
    fontSize: 13, color: BegaColors.textMuted, textAlign: 'center',
    lineHeight: 20, marginBottom: 24,
  },
  permBtn: {
    backgroundColor: BegaColors.cyan, borderRadius: 3,
    paddingHorizontal: 32, paddingVertical: 14, marginBottom: 12, width: '100%', alignItems: 'center',
  },
  permBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1.5 },
  permBtnGhost: {
    borderWidth: 1, borderColor: BegaColors.cardBorder, borderRadius: 3,
    paddingHorizontal: 32, paddingVertical: 12, width: '100%', alignItems: 'center',
  },
  permBtnGhostText: { color: BegaColors.textMuted, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1 },
});
