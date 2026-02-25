import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../services/store';
import { COLORS, SPACING, RADIUS, FONTS, FONT_SIZE } from '../constants/theme';
import type { RootStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.72;
const SCAN_AREA_HEIGHT = SCAN_AREA_SIZE * 0.6;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { scanBarcode, isScanning, scanError, currentProduct } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;

  // 스캔 라인 애니메이션
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // 상품 찾으면 결과 화면으로 이동
  useEffect(() => {
    if (currentProduct && !isScanning) {
      navigation.navigate('ProductResult', { product: currentProduct });
    }
  }, [currentProduct, isScanning]);

  // 바코드 감지 시 실행되는 함수
  const onBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (hasScanned || isScanning) return;
    setHasScanned(true);
    await scanBarcode(data);
  };

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_HEIGHT - 4],
  });

  // 카메라 권한 요청
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionEmoji}>📸</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          We need your camera to scan barcodes
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.permissionBack}>
          <Text style={styles.permissionBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카메라 뷰 */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={hasScanned ? undefined : onBarcodeScanned}
      />

      {/* 어두운 오버레이 */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            {/* 모서리 브라켓 */}
            <View style={[styles.corner, { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 }]} />
            <View style={[styles.corner, { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 }]} />
            <View style={[styles.corner, { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 }]} />
            <View style={[styles.corner, { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 }]} />

            {/* 스캔 라인 */}
            {!hasScanned && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* 뒤로가기 버튼 */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={{ color: '#fff', fontSize: 24 }}>‹</Text>
      </TouchableOpacity>

      {/* 상태 텍스트 */}
      <View style={styles.statusArea}>
        {isScanning ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={COLORS.brand.cyan} />
            <Text style={styles.statusText}>Looking up product...</Text>
          </View>
        ) : scanError ? (
          <View style={styles.statusBox}>
            <Text style={styles.errorText}>{scanError}</Text>
            <TouchableOpacity
              onPress={() => { setHasScanned(false); useStore.getState().clearScan(); }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hintText}>Position barcode inside the frame</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // 권한 요청 화면
  permissionContainer: {
    flex: 1, backgroundColor: '#fff', alignItems: 'center',
    justifyContent: 'center', padding: 40,
  },
  permissionEmoji: { fontSize: 64, marginBottom: 16 },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: '#1A1D26', marginBottom: 8 },
  permissionText: { fontSize: 15, color: '#8E94A4', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  permissionBtn: {
    backgroundColor: '#3778FB', paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: 16, marginBottom: 12,
  },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  permissionBack: { padding: 12 },
  permissionBackText: { color: '#8E94A4', fontSize: 14, fontWeight: '600' },

  // 오버레이
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: SCAN_AREA_HEIGHT },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },

  scanArea: { width: SCAN_AREA_SIZE, height: SCAN_AREA_HEIGHT },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#3778FB' },
  scanLine: {
    position: 'absolute', left: 12, right: 12, height: 2,
    backgroundColor: '#3778FB',
    shadowColor: '#3778FB', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10,
  },

  backBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 44, left: 20,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },

  statusArea: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center' },
  statusBox: { alignItems: 'center', gap: 10 },
  statusText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  hintText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '500' },
  errorText: { color: '#FF6B35', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: 'rgba(55,120,251,0.15)', borderWidth: 1, borderColor: 'rgba(55,120,251,0.3)',
  },
  retryText: { color: '#3778FB', fontSize: 13, fontWeight: '700' },
});