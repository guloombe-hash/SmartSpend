/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Social Screen
 * Community savings goals & inspiration
 * ─────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useStore } from '../services/store';
import { COLORS, SPACING, RADIUS, FONTS, FONT_SIZE } from '../constants/theme';
import type { GoalTemplate } from '../types';

// ─── Mock Community Templates ───
const COMMUNITY_TEMPLATES: GoalTemplate[] = [
  {
    id: 't1',
    authorId: 'u1',
    authorName: 'Alex K.',
    title: 'Tokyo Trip Fund',
    icon: '🗼',
    skippedItem: 'Impulse Amazon purchases',
    investedIn: 'Japan travel',
    targetAmount: 4500,
    story:
      'Skipped 3 Amazon purchases a week for 8 months. Finally booked my flight!',
    copiedCount: 1247,
    createdAt: '2025-08-01T00:00:00Z',
  },
  {
    id: 't2',
    authorId: 'u2',
    authorName: 'Maya R.',
    title: 'MacBook Pro Fund',
    icon: '💻',
    skippedItem: 'Daily Starbucks',
    investedIn: 'New laptop for freelancing',
    targetAmount: 2499,
    story: 'Every time I skipped a $7 latte, I moved it here. 14 months later...',
    copiedCount: 892,
    createdAt: '2025-06-15T00:00:00Z',
  },
  {
    id: 't3',
    authorId: 'u3',
    authorName: 'Jordan T.',
    title: 'Emergency Fund',
    icon: '🛡️',
    skippedItem: 'Eating out for lunch',
    investedIn: '3-month safety net',
    targetAmount: 5000,
    story:
      'Brought lunch from home instead of spending $15 daily. Saved $3k in 7 months.',
    copiedCount: 2103,
    createdAt: '2025-05-20T00:00:00Z',
  },
  {
    id: 't4',
    authorId: 'u4',
    authorName: 'Sam W.',
    title: 'Gym Equipment',
    icon: '🏋️',
    skippedItem: 'Gaming microtransactions',
    investedIn: 'Home gym setup',
    targetAmount: 800,
    story:
      'Cancelled my FIFA Ultimate Team habit. Got a power rack in 4 months.',
    copiedCount: 445,
    createdAt: '2025-09-10T00:00:00Z',
  },
];

// ─── Trending Badge ───
function TrendBadge({ count }: { count: number }) {
  const label =
    count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
  return (
    <View style={styles.trendBadge}>
      <Text style={styles.trendIcon}>🔥</Text>
      <Text style={styles.trendText}>{label} copies</Text>
    </View>
  );
}

// ─── Template Card ───
function TemplateCard({
  template,
  onCopy,
  isCopied,
}: {
  template: GoalTemplate;
  onCopy: (t: GoalTemplate) => void;
  isCopied: boolean;
}) {
  return (
    <View style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <View style={styles.templateLeft}>
          <View style={styles.templateIcon}>
            <Text style={{ fontSize: 24 }}>{template.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.templateTitle}>{template.title}</Text>
            <Text style={styles.templateAuthor}>by {template.authorName}</Text>
          </View>
        </View>
        <TrendBadge count={template.copiedCount} />
      </View>

      {/* Story */}
      <Text style={styles.templateStory}>"{template.story}"</Text>

      {/* Stats Row */}
      <View style={styles.templateStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>SKIPPED</Text>
          <Text style={styles.statValue}>{template.skippedItem}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TARGET</Text>
          <Text style={[styles.statValue, { color: COLORS.brand.green }]}>
            ${template.targetAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Copy Button */}
      <TouchableOpacity
        onPress={() => !isCopied && onCopy(template)}
        style={[styles.copyBtn, isCopied && styles.copyBtnDone]}
        activeOpacity={0.8}
      >
        <Text style={[styles.copyBtnText, isCopied && styles.copyBtnDoneText]}>
          {isCopied ? '✓ Goal Added!' : 'Copy This Goal'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ───
export default function SocialScreen() {
  const { addGoal } = useStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (template: GoalTemplate) => {
    addGoal({
      title: template.title,
      icon: template.icon,
      targetAmount: template.targetAmount,
      savedAmount: 0,
      templateId: template.id,
    });
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.appLabel}>COMMUNITY</Text>
        <Text style={styles.headline}>Inspire & Be{'\n'}
          <Text style={styles.headlineAccent}>Inspired</Text>
        </Text>
      </View>

      {/* ─── Stats Banner ─── */}
      <View style={styles.statsBanner}>
        <View style={styles.bannerStat}>
          <Text style={styles.bannerValue}>12.4k</Text>
          <Text style={styles.bannerLabel}>Goals Created</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={[styles.bannerValue, { color: COLORS.brand.cyan }]}>
            $2.1M
          </Text>
          <Text style={styles.bannerLabel}>Collectively Saved</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={[styles.bannerValue, { color: COLORS.accent.gold }]}>
            89%
          </Text>
          <Text style={styles.bannerLabel}>Goal Rate</Text>
        </View>
      </View>

      {/* ─── Section Title ─── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>🏆 Trending Goals</Text>
        <TouchableOpacity>
          <Text style={styles.sectionMore}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Template List ─── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {COMMUNITY_TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} onCopy={handleCopy} isCopied={copiedId === t.id} />
        ))}

        {/* Coming Soon */}
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonIcon}>🚀</Text>
          <Text style={styles.comingSoonTitle}>More features coming soon</Text>
          <Text style={styles.comingSoonText}>
            Follow friends, share your wins, and compete on savings leaderboards.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
  },

  // ─── Header ───
  header: {
    paddingHorizontal: SPACING['2xl'],
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
    color: COLORS.brand.cyan,
  },

  // ─── Stats Banner ───
  statsBanner: {
    flexDirection: 'row',
    marginHorizontal: SPACING['2xl'],
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.lg,
  },
  bannerStat: {
    flex: 1,
    alignItems: 'center',
  },
  bannerDivider: {
    width: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: 2,
  },
  bannerValue: {
    fontSize: FONT_SIZE.xl,
    ...FONTS.mono,
    color: COLORS.brand.green,
    marginBottom: 2,
  },
  bannerLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.muted,
    ...FONTS.caption,
    textAlign: 'center',
  },

  // ─── Section Row ───
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    ...FONTS.heading,
    color: COLORS.text.primary,
  },
  sectionMore: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.brand.cyan,
    ...FONTS.caption,
  },

  // ─── Scroll ───
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: 40,
  },

  // ─── Template Card ───
  templateCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginBottom: SPACING.lg,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  templateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.overlay.medium,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateTitle: {
    fontSize: FONT_SIZE.lg,
    ...FONTS.subheading,
    color: COLORS.text.primary,
  },
  templateAuthor: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  trendIcon: { fontSize: 10 },
  trendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.accent.warning,
    ...FONTS.mono,
  },
  templateStory: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: SPACING.lg,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.brand.cyan,
    paddingLeft: SPACING.md,
  },
  templateStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlay.light,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: 2,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: 3,
  },
  statValue: {
    fontSize: FONT_SIZE.sm,
    ...FONTS.subheading,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  copyBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
  },
  copyBtnText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.brand.cyan,
  },
  copyBtnDone: {
    backgroundColor: COLORS.overlay.brand,
    borderColor: COLORS.border.brand,
  },
  copyBtnDoneText: {
    color: COLORS.brand.green,
  },

  // ─── Coming Soon ───
  comingSoon: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  comingSoonIcon: { fontSize: 48, marginBottom: SPACING.lg },
  comingSoonTitle: {
    fontSize: FONT_SIZE.xl,
    ...FONTS.heading,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  comingSoonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
});
