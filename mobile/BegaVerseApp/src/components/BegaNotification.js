import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  StyleSheet, Modal,
} from 'react-native';
import { BegaColors, BegaCardShadow } from '../../constants/theme';

const TYPE = {
  success: { accent: BegaColors.greenBright, icon: '✓' },
  error:   { accent: BegaColors.redBright,   icon: '✕' },
  warning: { accent: BegaColors.amber,        icon: '!' },
  info:    { accent: BegaColors.cyan,         icon: 'i' },
};

const NotificationContext = createContext(null);

export function BegaNotificationProvider({ children }) {
  const [toast,  setToast]  = useState(null);
  const [dialog, setDialog] = useState(null);
  const slideY = useRef(new Animated.Value(-120)).current;
  const timer  = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 3200) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    Animated.spring(slideY, {
      toValue: 0, tension: 80, friction: 10, useNativeDriver: true,
    }).start();
    timer.current = setTimeout(() => {
      Animated.timing(slideY, {
        toValue: -120, duration: 280, useNativeDriver: true,
      }).start(() => setToast(null));
    }, duration);
  }, []);

  const showDialog = useCallback(({ title, message, type = 'info', buttons = [] }) => {
    setDialog({ title, message, type, buttons });
  }, []);

  const dismissDialog = () => setDialog(null);

  return (
    <NotificationContext.Provider value={{ showToast, showDialog }}>
      <View style={{ flex: 1 }}>
        {children}

        {toast && (
          <Animated.View
            style={[
              styles.toast,
              {
                borderLeftColor: TYPE[toast.type].accent,
                transform: [{ translateY: slideY }],
              },
            ]}
          >
            <View style={[styles.toastIconWrap, { borderColor: TYPE[toast.type].accent + '66' }]}>
              <Text style={[styles.toastIconText, { color: TYPE[toast.type].accent }]}>
                {TYPE[toast.type].icon}
              </Text>
            </View>
            <Text style={styles.toastMsg} numberOfLines={2}>{toast.message}</Text>
          </Animated.View>
        )}
      </View>

      {dialog && (
        <Modal transparent animationType="fade" visible statusBarTranslucent>
          <View style={styles.dialogBack}>
            <View style={[styles.dialogCard, { borderLeftColor: TYPE[dialog.type].accent }]}>
              <View style={styles.dialogRow}>
                <View style={[
                  styles.dialogBadge,
                  {
                    backgroundColor: TYPE[dialog.type].accent + '1A',
                    borderColor: TYPE[dialog.type].accent + '55',
                  },
                ]}>
                  <Text style={[styles.dialogBadgeText, { color: TYPE[dialog.type].accent }]}>
                    {TYPE[dialog.type].icon}
                  </Text>
                </View>
                <Text style={styles.dialogTitle}>{dialog.title}</Text>
              </View>

              {!!dialog.message && (
                <Text style={styles.dialogMsg}>{dialog.message}</Text>
              )}

              <View style={[
                styles.dialogBtns,
                dialog.buttons.length === 1 && { justifyContent: 'flex-end' },
              ]}>
                {dialog.buttons.map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dialogBtn,
                      btn.style === 'cancel' ? styles.dialogBtnCancel : styles.dialogBtnPrimary,
                      i > 0 && { marginLeft: 10 },
                    ]}
                    onPress={() => { dismissDialog(); btn.onPress?.(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.dialogBtnText,
                      btn.style === 'cancel' && styles.dialogBtnCancelText,
                    ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </NotificationContext.Provider>
  );
}

export function useBegaNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useBegaNotify must be used inside BegaNotificationProvider');
  return ctx;
}

const styles = StyleSheet.create({
  // ── Toast ───────────────────────────────────────────────
  toast: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: BegaColors.navy,
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
    borderLeftWidth: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    zIndex: 9999,
    ...BegaCardShadow,
  },
  toastIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastIconText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  toastMsg: {
    flex: 1,
    color: BegaColors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Dialog ──────────────────────────────────────────────
  dialogBack: {
    flex: 1,
    backgroundColor: 'rgba(3, 12, 24, 0.88)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    backgroundColor: BegaColors.cardBg,
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
    borderLeftWidth: 3,
    borderRadius: 4,
    padding: 24,
    ...BegaCardShadow,
  },
  dialogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dialogBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  dialogTitle: {
    flex: 1,
    color: BegaColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dialogMsg: {
    color: BegaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    marginLeft: 46,
  },
  dialogBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  dialogBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 3,
    minWidth: 80,
    alignItems: 'center',
  },
  dialogBtnPrimary: {
    backgroundColor: BegaColors.cyan,
  },
  dialogBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BegaColors.cardBorder,
  },
  dialogBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  dialogBtnCancelText: {
    color: BegaColors.textMuted,
  },
});
