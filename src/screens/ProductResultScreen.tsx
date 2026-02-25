/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Product Result Screen
 * 
 * Displays scanned product with:
 *   - Price comparison across stores
 *   - Opportunity cost visualization
 *   - Goal impact warning
 *   - Buy / Skip decision buttons
 * ─────────────────────────────────────────────
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../services/store';
import { calculateGoalDelay, wrapAffiliateLink } from '../services/productLookup';
import { COLORS, SPACING, RADIUS, FONTS, FONT_SIZE } from '../constants/theme';
import type { RootStackParamList, ProductPrice } from '../types';

type ScreenRouteProp = RouteProp<RootStackParamList, 'ProductResult'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductResult'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Animated entrance helper ───
function useSlideIn(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  };
}

// ─── Price Row Component ───
function PriceRow({ item, isFirst, msrp }: { item: ProductPrice; isFirst: boolean; msrp: number }) {
  const savings = msrp - item.price;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.priceRow, isFirst && styles.priceRowBest]}
    >
      <View style={styles.priceRowLeft}>
        <View style={styles.storeIcon}>
          <Text style={styles.storeInitial}>{item.store.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.storeName}>{item.store}</Text>
          {isFirst && <Text style={styles.bestBadge}>✓ BEST PRICE</Text>}
        </View>
      </View>
      <View style={styles.priceRowRight}>
        <Text style={[styles.priceAmount, isFirst && styles.priceAmountBest]}>
          ${item.price.toFixed(2)}
        </Text>
        {savings > 0 && (
          <Text style={styles.savingsText}>Save ${savings.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Opportunity Cost Item ───
function CostEquivalent({ icon, label, count, index }: {
  icon: string; label: string; count: number; index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: 400 + index * 100,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.equivItem,
        {
          opacity: anim,
          transform: [{ scale: anim }],
        },
      ]}
    >
      <Text style={styles.equivIcon}>{icon}</Text>
      <Text style={styles.equivCount}>{count}</Text>
      <Text style={styles.equivLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Main Screen ───
export default function ProductResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { product } = route.params;
  const { recordDecision, user } = useStore();

  const bestPrice = product.prices[0]?.price || product.msrp;
  const activeGoal = user.goals[0];
  const goalDelay = calculateGoalDelay(bestPrice);

  // Entrance animations
  const headerAnim = useSlideIn(0);
  const priceAnim = useSlideIn(150);
  const equivAnim = useSlideIn(300);
  const goalAnim = useSlideIn(450);
  const actionAnim = useSlideIn(550);

  const handleBuy = () => {
    recordDecision('bought');
    navigation.popToTop();
  };

  const handleSkip = () => {
    recordDecision('skipped');
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header Bar ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ANALYSIS</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Text style={{ fontSize: 16 }}>🔖</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Product Card ─── */}
        <Animated.View style={[styles.productCard, headerAnim]}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.productImagePlaceholder]}>
              <Text style={{ fontSize: 48 }}>📦</Text>
            </View>
          )}
          <View style={styles.imageOverlay} />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productBrand}>{product.brand}</Text>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.priceRow_main}>
              <Text style={styles.mainPrice}>${product.msrp.toFixed(2)}</Text>
              <Text style={styles.msrpLabel}>MSRP</Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Price Comparison ─── */}
        {product.prices.length > 0 && (
          <Animated.View style={[styles.section, priceAnim]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🏷️</Text>
              <Text style={styles.sectionTitle}>Price Comparison</Text>
            </View>
            {product.prices.map((p, i) => (
              <PriceRow key={i} item={p} isFirst={i === 0} msrp={product.msrp} />
            ))}
          </Animated.View>
        )}

        {/* ─── Opportunity Cost ─── */}
        {product.equivalents.length > 0 && (
          <Animated.View style={[styles.section, equivAnim]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💭</Text>
              <Text style={styles.sectionTitle}>Think About It</Text>
            </View>
            <View style={styles.equivGrid}>
              {product.equivalents.slice(0, 4).map((eq, i) => (
                <CostEquivalent key={i} index={i} {...eq} />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ─── Goal Impact ─── */}
        {activeGoal && (
          <Animated.View style={[styles.goalImpact, goalAnim]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⚠️</Text>
              <Text style={styles.sectionTitle}>Goal Impact</Text>
            </View>
            <Text style={styles.goalText}>
              Buying this delays your{' '}
              <Text style={styles.goalHighlight}>{activeGoal.title}</Text> by
              approximately{' '}
              <Text style={styles.goalDays}>{goalDelay} days</Text>.
            </Text>
          </Animated.View>
        )}

        {/* ─── Decision Buttons ─── */}
        <Animated.View style={[styles.actions, actionAnim]}>
          <TouchableOpacity onPress={handleBuy} style={styles.buyButton} activeOpacity={0.8}>
            <Text style={styles.buyButtonText}>
              Buy at Best Price — ${bestPrice.toFixed(2)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.8}>
            <Text style={styles.skipButtonText}>
              Skip & Save ${bestPrice.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.overlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  headerBtnIcon: {
    fontSize: 28,
    color: COLORS.text.primary,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: FONT_SIZE.base,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 2,
  },

  // ─── Scroll ───
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: 120,
  },

  // ─── Product Card ───
  productCard: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginBottom: SPACING.lg,
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productImagePlaceholder: {
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 100,
    height: 100,
  },
  categoryBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    ...FONTS.mono,
    color: COLORS.brand.green,
  },
  productInfo: {
    padding: SPACING.xl,
  },
  productBrand: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.muted,
    ...FONTS.caption,
    marginBottom: 2,
  },
  productName: {
    fontSize: FONT_SIZE['2xl'],
    ...FONTS.heading,
    color: COLORS.text.primary,
    lineHeight: 26,
    marginBottom: SPACING.md,
  },
  priceRow_main: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  mainPrice: {
    fontSize: FONT_SIZE['5xl'],
    ...FONTS.mono,
    color: COLORS.brand.green,
  },
  msrpLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.muted,
  },

  // ─── Sections ───
  section: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 14,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    ...FONTS.heading,
    color: COLORS.text.primary,
  },

  // ─── Price Rows ───
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginBottom: SPACING.sm,
  },
  priceRowBest: {
    backgroundColor: COLORS.overlay.brand,
    borderColor: COLORS.border.brand,
  },
  priceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  storeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.overlay.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInitial: {
    fontSize: FONT_SIZE.base,
    ...FONTS.heading,
    color: COLORS.text.muted,
  },
  storeName: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.text.primary,
  },
  bestBadge: {
    fontSize: FONT_SIZE.xs,
    ...FONTS.mono,
    color: COLORS.brand.green,
    letterSpacing: 1,
  },
  priceRowRight: { alignItems: 'flex-end' },
  priceAmount: {
    fontSize: FONT_SIZE.xl,
    ...FONTS.mono,
    color: COLORS.text.primary,
  },
  priceAmountBest: { color: COLORS.brand.green },
  savingsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.brand.green,
    ...FONTS.caption,
  },

  // ─── Equivalents Grid ───
  equivGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  equivItem: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 80) / 2,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    alignItems: 'center',
  },
  equivIcon: { fontSize: 28 },
  equivCount: {
    fontSize: FONT_SIZE['3xl'],
    ...FONTS.mono,
    color: COLORS.brand.cyan,
    marginTop: SPACING.xs,
  },
  equivLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.muted,
    ...FONTS.caption,
    marginTop: 2,
  },

  // ─── Goal Impact ───
  goalImpact: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.15)',
    backgroundColor: 'rgba(255,107,53,0.06)',
    marginBottom: SPACING.lg,
  },
  goalText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  goalHighlight: {
    color: COLORS.accent.gold,
    ...FONTS.subheading,
  },
  goalDays: {
    color: COLORS.accent.warning,
    ...FONTS.mono,
  },

  // ─── Action Buttons ───
  actions: {
    gap: SPACING.md,
  },
  buyButton: {
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    shadowColor: COLORS.brand.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    // Note: LinearGradient would be used here in production
    backgroundColor: COLORS.brand.green,
  },
  buyButtonText: {
    fontSize: FONT_SIZE.lg + 1,
    ...FONTS.heading,
    color: COLORS.bg.primary,
  },
  skipButton: {
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.3)',
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  skipButtonText: {
    fontSize: FONT_SIZE.lg + 1,
    ...FONTS.heading,
    color: COLORS.accent.warning,
  },
});
