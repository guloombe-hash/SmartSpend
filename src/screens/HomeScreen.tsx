/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Home Screen
 * ─────────────────────────────────────────────
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import type { ScanHistoryItem } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../services/store';
import { COLORS, SPACING, RADIUS, FONTS, FONT_SIZE } from '../constants/theme';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── UPC Manual Input Modal ───
function UPCInputModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (upc: string) => void;
  isLoading: boolean;
}) {
  const [upc, setUpc] = useState('');

  const handleSubmit = () => {
    const cleaned = upc.replace(/[\s\-]/g, '');
    if (!/^\d{8,13}$/.test(cleaned)) {
      Alert.alert('Invalid UPC', 'Please enter 8-13 digits.');
      return;
    }
    onSubmit(cleaned);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.box}>
          <Text style={modalStyles.title}>Enter UPC Code</Text>
          <Text style={modalStyles.subtitle}>Type the barcode number manually</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="e.g. 012345678901"
            placeholderTextColor={COLORS.text.disabled}
            keyboardType="numeric"
            value={upc}
            onChangeText={setUpc}
            maxLength={13}
            autoFocus
          />
          <View style={modalStyles.buttons}>
            <TouchableOpacity onPress={onClose} style={modalStyles.cancelBtn}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[modalStyles.submitBtn, !upc.trim() && { opacity: 0.4 }]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.bg.primary} size="small" />
              ) : (
                <Text style={modalStyles.submitText}>Look Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── URL Input Modal ───
function URLInputModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\/.+\..+/.test(trimmed)) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.box}>
          <Text style={modalStyles.title}>Paste Product URL</Text>
          <Text style={modalStyles.subtitle}>Paste a link from any online store</Text>
          <TextInput
            style={[modalStyles.input, { letterSpacing: 0, fontSize: FONT_SIZE.base }]}
            placeholder="https://www.amazon.com/dp/..."
            placeholderTextColor={COLORS.text.disabled}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            value={url}
            onChangeText={setUrl}
            autoFocus
          />
          {error && (
            <View style={modalStyles.errorBox}>
              <Text style={modalStyles.errorText}>{error}</Text>
            </View>
          )}
          <View style={modalStyles.supportedStores}>
            <Text style={modalStyles.supportedLabel}>Works with:</Text>
            <Text style={modalStyles.supportedList}>Amazon, Walmart, Target, Best Buy, eBay & more</Text>
          </View>
          <View style={modalStyles.buttons}>
            <TouchableOpacity onPress={onClose} style={modalStyles.cancelBtn}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[modalStyles.submitBtn, !url.trim() && { opacity: 0.4 }]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.bg.primary} size="small" />
              ) : (
                <Text style={modalStyles.submitText}>Analyze</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Photo Picker Modal ───
function PhotoPickerModal({
  visible,
  onClose,
  onPickImage,
  isLoading,
  error,
}: {
  visible: boolean;
  onClose: () => void;
  onPickImage: (uri: string) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      onPickImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Gallery access is required to select photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      onPickImage(result.assets[0].uri);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={isLoading ? undefined : onClose} />
        <View style={modalStyles.box}>
          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: SPACING['3xl'] }}>
              <ActivityIndicator size="large" color={COLORS.brand.cyan} />
              <Text style={[modalStyles.title, { marginTop: SPACING.xl, fontSize: FONT_SIZE.xl }]}>
                Analyzing Product...
              </Text>
              <Text style={modalStyles.subtitle}>AI is identifying your product</Text>
            </View>
          ) : (
            <>
              <Text style={modalStyles.title}>Scan Product Photo</Text>
              <Text style={modalStyles.subtitle}>Take a photo or choose from your gallery</Text>
              {error && (
                <View style={modalStyles.errorBox}>
                  <Text style={modalStyles.errorText}>{error}</Text>
                </View>
              )}
              <TouchableOpacity onPress={takePhoto} style={photoModalStyles.optionBtn}>
                <Text style={photoModalStyles.optionIcon}>📸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={photoModalStyles.optionTitle}>Take a Photo</Text>
                  <Text style={photoModalStyles.optionDesc}>Use camera to capture the product</Text>
                </View>
                <Text style={photoModalStyles.arrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickFromGallery} style={photoModalStyles.optionBtn}>
                <Text style={photoModalStyles.optionIcon}>🖼️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={photoModalStyles.optionTitle}>Choose from Gallery</Text>
                  <Text style={photoModalStyles.optionDesc}>Select an existing photo</Text>
                </View>
                <Text style={photoModalStyles.arrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={[modalStyles.cancelBtn, { marginTop: SPACING.lg }]}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, scanBarcode, scanURL, scanPhoto, isScanning, scanError, currentProduct, clearScan } = useStore();
  const activeGoal = user.goals[0];
  const [showUPCModal, setShowUPCModal] = useState(false);
  const [showURLModal, setShowURLModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Navigate to result when product found via UPC/URL input
  useEffect(() => {
    if (currentProduct && !isScanning) {
      setShowUPCModal(false);
      setShowURLModal(false);
      setShowPhotoModal(false);
      navigation.navigate('ProductResult', { product: currentProduct });
    }
  }, [currentProduct, isScanning]);

  // Glow animation for scan button
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.4],
  });

  const goalPercent = activeGoal
    ? Math.round((activeGoal.savedAmount / activeGoal.targetAmount) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appLabel}>SMARTSPEND</Text>
          <Text style={styles.headline}>
            Before you buy,{'\n'}
            <Text style={styles.headlineAccent}>think twice.</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={{ fontSize: 20 }}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Goal Card ─── */}
      {activeGoal && (
        <TouchableOpacity activeOpacity={0.8} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalLeft}>
              <Text style={{ fontSize: 22 }}>{activeGoal.icon}</Text>
              <View>
                <Text style={styles.goalTitle}>{activeGoal.title}</Text>
                <Text style={styles.goalProgress}>
                  ${activeGoal.savedAmount.toLocaleString()} / ${activeGoal.targetAmount.toLocaleString()}
                </Text>
              </View>
            </View>
            <Text style={styles.goalPercent}>{goalPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${goalPercent}%` }]} />
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Scan Area ─── */}
        <View style={styles.scanArea}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Scanner')}
            activeOpacity={0.85}
            style={styles.scanButton}
          >
            <Animated.View
              style={[styles.scanGlow, { opacity: glowOpacity }]}
            />
            <View style={styles.scanInner}>
              <Text style={styles.scanIcon}>⊞</Text>
              <Text style={styles.scanLabel}>SCAN</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.scanHint}>
            Point your camera at any barcode{'\n'}to get instant price analysis
          </Text>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {[
              { icon: '📷', label: 'Photo', onPress: () => setShowPhotoModal(true) },
              { icon: '🔗', label: 'URL', onPress: () => setShowURLModal(true) },
              { icon: '⌨️', label: 'UPC', onPress: () => setShowUPCModal(true) },
            ].map((item, i) => (
              <TouchableOpacity key={i} onPress={item.onPress} style={styles.quickBtn}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Recent Scans ─── */}
        {user.scanHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Scans</Text>
            {user.scanHistory.slice(0, 5).map((item: ScanHistoryItem) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={[
                    styles.historyBadge,
                    item.decision === 'skipped' && styles.historyBadgeSkipped,
                  ]}>
                    <Text style={styles.historyBadgeText}>
                      {item.decision === 'skipped' ? '✓' : '$'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {item.decision === 'skipped' ? 'Skipped' : 'Bought'} · {new Date(item.scannedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.historyAmount,
                  item.decision === 'skipped' && styles.historyAmountSaved,
                ]}>
                  {item.decision === 'skipped' ? '+' : '-'}${(item.savedAmount || item.product.prices[0]?.price || 0).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ─── Modals ─── */}
      <UPCInputModal
        visible={showUPCModal}
        onClose={() => { setShowUPCModal(false); clearScan(); }}
        onSubmit={(upc) => scanBarcode(upc)}
        isLoading={isScanning}
      />
      <URLInputModal
        visible={showURLModal}
        onClose={() => { setShowURLModal(false); clearScan(); }}
        onSubmit={(url) => scanURL(url)}
        isLoading={isScanning}
        error={scanError}
      />
      <PhotoPickerModal
        visible={showPhotoModal}
        onClose={() => { setShowPhotoModal(false); clearScan(); }}
        onPickImage={(uri) => scanPhoto(uri)}
        isLoading={isScanning}
        error={scanError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: SPACING['2xl'],
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  appLabel: {
    fontSize: FONT_SIZE.base,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  headline: {
    fontSize: FONT_SIZE['4xl'],
    ...FONTS.heading,
    color: COLORS.text.primary,
    lineHeight: 34,
  },
  headlineAccent: {
    color: COLORS.brand.green,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },

  // ─── Goal Card ───
  goalCard: {
    backgroundColor: COLORS.overlay.brand,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border.brand,
    marginBottom: SPACING['2xl'],
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  goalTitle: {
    fontSize: FONT_SIZE.lg,
    ...FONTS.subheading,
    color: COLORS.text.primary,
  },
  goalProgress: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.muted,
  },
  goalPercent: {
    fontSize: FONT_SIZE.md,
    ...FONTS.mono,
    color: COLORS.brand.green,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.overlay.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.brand.green,
  },

  // ─── Scroll ───
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // ─── Scan Area ───
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
  },
  scanButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 80,
    backgroundColor: COLORS.brand.green,
  },
  scanInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  scanIcon: {
    fontSize: 44,
    color: COLORS.brand.green,
  },
  scanLabel: {
    fontSize: FONT_SIZE.md,
    ...FONTS.mono,
    color: COLORS.brand.green,
    letterSpacing: 2,
    marginTop: SPACING.sm,
  },
  scanHint: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.disabled,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.lg,
    maxWidth: 240,
  },

  // ─── Quick Actions ───
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  quickBtn: {
    width: 80,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  quickLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.tertiary,
    ...FONTS.caption,
  },

  // ─── History Section ───
  historySection: {
    marginTop: SPACING.xl,
  },
  historyTitle: {
    fontSize: FONT_SIZE.lg,
    ...FONTS.heading,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginBottom: SPACING.sm,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  historyBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadgeSkipped: {
    backgroundColor: COLORS.overlay.brand,
  },
  historyBadgeText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.mono,
    color: COLORS.brand.green,
  },
  historyName: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.text.primary,
  },
  historyMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: FONT_SIZE.base,
    ...FONTS.mono,
    color: COLORS.accent.warning,
    marginLeft: SPACING.md,
  },
  historyAmountSaved: {
    color: COLORS.brand.green,
  },
});

// ─── Modal Styles ───
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  box: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS['2xl'],
    padding: SPACING['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    ...FONTS.heading,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.muted,
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: FONT_SIZE.xl,
    ...FONTS.mono,
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
    letterSpacing: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.overlay.medium,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  cancelBtnFull: {
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.overlay.medium,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  cancelText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.text.muted,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.brand.green,
  },
  submitText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.heading,
    color: COLORS.bg.primary,
  },
  comingSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.overlay.brand,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  comingSoonIcon: { fontSize: 18 },
  comingSoonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.brand.green,
    ...FONTS.caption,
  },
  errorBox: {
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.15)',
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.accent.danger,
    ...FONTS.caption,
    textAlign: 'center',
  },
  supportedStores: {
    marginBottom: SPACING.xl,
  },
  supportedLabel: {
    fontSize: FONT_SIZE.xs,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  supportedList: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.tertiary,
    ...FONTS.caption,
  },
});

// ─── Photo Modal Styles ───
const photoModalStyles = StyleSheet.create({
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlay.light,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    marginBottom: SPACING.md,
    gap: SPACING.lg,
  },
  optionIcon: {
    fontSize: 28,
  },
  optionTitle: {
    fontSize: FONT_SIZE.lg,
    ...FONTS.subheading,
    color: COLORS.text.primary,
  },
  optionDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.text.disabled,
    ...FONTS.body,
  },
});
