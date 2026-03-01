/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Social Screen
 * Community savings goals & inspiration
 * ─────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useStore } from '../services/store';
import { COLORS, SPACING, RADIUS, FONTS, FONT_SIZE } from '../constants/theme';
import type { GoalTemplate } from '../types';

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
  onLike,
  isCopied,
  isLiked,
  likeCount,
}: {
  template: GoalTemplate;
  onCopy: (t: GoalTemplate) => void;
  onLike: (id: string) => void;
  isCopied: boolean;
  isLiked: boolean;
  likeCount: number;
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

      {/* Action Row: Like + Copy */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => onLike(template.id)}
          style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
          activeOpacity={0.7}
        >
          <Text style={styles.likeBtnIcon}>{isLiked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.likeBtnText, isLiked && styles.likeBtnTextActive]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

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
    </View>
  );
}

// ─── Share Modal ───
function ShareModal({
  visible,
  onClose,
  onPublish,
}: {
  visible: boolean;
  onClose: () => void;
  onPublish: (data: {
    title: string;
    icon: string;
    skippedItem: string;
    investedIn: string;
    targetAmount: number;
    story: string;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [skippedItem, setSkippedItem] = useState('');
  const [investedIn, setInvestedIn] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [story, setStory] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !skippedItem.trim() || !story.trim() || !targetAmount) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    onPublish({
      title: title.trim(),
      icon,
      skippedItem: skippedItem.trim(),
      investedIn: investedIn.trim(),
      targetAmount: Number(targetAmount),
      story: story.trim(),
    });
    // Reset
    setTitle('');
    setIcon('🎯');
    setSkippedItem('');
    setInvestedIn('');
    setTargetAmount('');
    setStory('');
    onClose();
  };

  const ICON_OPTIONS = ['🎯', '🗼', '💻', '🛡️', '🏋️', '✈️', '🎓', '🚗', '🏠', '💎'];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Share Your Goal</Text>
          <Text style={styles.modalSubtitle}>
            Inspire the community with your savings story
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
            {/* Icon Picker */}
            <Text style={styles.inputLabel}>Icon</Text>
            <View style={styles.iconPicker}>
              {ICON_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setIcon(e)}
                  style={[styles.iconOption, icon === e && styles.iconOptionSelected]}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.inputLabel}>Goal Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Tokyo Trip Fund"
              placeholderTextColor={COLORS.text.muted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Skipped Item */}
            <Text style={styles.inputLabel}>What did you skip? *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Daily Starbucks"
              placeholderTextColor={COLORS.text.muted}
              value={skippedItem}
              onChangeText={setSkippedItem}
            />

            {/* Invested In */}
            <Text style={styles.inputLabel}>Invested in</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Japan travel"
              placeholderTextColor={COLORS.text.muted}
              value={investedIn}
              onChangeText={setInvestedIn}
            />

            {/* Target Amount */}
            <Text style={styles.inputLabel}>Target Amount ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 4500"
              placeholderTextColor={COLORS.text.muted}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
            />

            {/* Story */}
            <Text style={styles.inputLabel}>Your Story *</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Tell the community how you did it..."
              placeholderTextColor={COLORS.text.muted}
              value={story}
              onChangeText={setStory}
              multiline
              numberOfLines={3}
            />

            {/* Buttons */}
            <TouchableOpacity style={styles.publishBtn} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.publishBtnText}>Publish to Community</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───
export default function SocialScreen() {
  const {
    authUser,
    goalTemplates,
    isLoadingTemplates,
    loadTemplates,
    copyTemplate,
    toggleTemplateLike,
    publishTemplate,
  } = useStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCopy = (template: GoalTemplate) => {
    copyTemplate(template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePublish = async (data: {
    title: string;
    icon: string;
    skippedItem: string;
    investedIn: string;
    targetAmount: number;
    story: string;
  }) => {
    await publishTemplate(data);
    Alert.alert('Published!', 'Your goal has been shared with the community.');
  };

  const uid = authUser?.uid || '';

  // Compute stats from real data
  const totalGoals = goalTemplates.length;
  const totalCopies = goalTemplates.reduce((sum, t) => sum + t.copiedCount, 0);
  const totalTargetSaved = goalTemplates.reduce((sum, t) => sum + t.targetAmount * t.copiedCount, 0);

  const formatCount = (n: number) =>
    n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

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
          <Text style={styles.bannerValue}>{formatCount(totalGoals)}</Text>
          <Text style={styles.bannerLabel}>Goals Shared</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={[styles.bannerValue, { color: COLORS.brand.cyan }]}>
            ${formatCount(totalTargetSaved)}
          </Text>
          <Text style={styles.bannerLabel}>Target Savings</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={[styles.bannerValue, { color: COLORS.accent.gold }]}>
            {formatCount(totalCopies)}
          </Text>
          <Text style={styles.bannerLabel}>Total Copies</Text>
        </View>
      </View>

      {/* ─── Section Title + Share Button ─── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Trending Goals</Text>
        <TouchableOpacity onPress={() => setShowShareModal(true)} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>+ Share My Goal</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Template List ─── */}
      {isLoadingTemplates ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand.cyan} />
          <Text style={styles.loadingText}>Loading community goals...</Text>
        </View>
      ) : goalTemplates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptyText}>Be the first to share your savings story!</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {goalTemplates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onCopy={handleCopy}
              onLike={toggleTemplateLike}
              isCopied={copiedId === t.id}
              isLiked={t.likedBy?.includes(uid) || false}
              likeCount={t.likedBy?.length || 0}
            />
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
      )}

      {/* ─── Share Modal ─── */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        onPublish={handlePublish}
      />
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
  shareBtn: {
    backgroundColor: 'rgba(57,255,20,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.25)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  shareBtnText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.brand.green,
    ...FONTS.subheading,
  },

  // ─── Loading / Empty ───
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.muted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.lg },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    ...FONTS.heading,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.muted,
    textAlign: 'center',
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

  // ─── Action Row ───
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  likeBtnActive: {
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderColor: 'rgba(255,59,48,0.2)',
  },
  likeBtnIcon: {
    fontSize: 16,
  },
  likeBtnText: {
    fontSize: FONT_SIZE.sm,
    ...FONTS.mono,
    color: COLORS.text.muted,
  },
  likeBtnTextActive: {
    color: '#FF3B30',
  },
  copyBtn: {
    flex: 1,
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

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: COLORS.bg.secondary,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZE['2xl'],
    ...FONTS.heading,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.muted,
    marginBottom: SPACING.xl,
  },
  modalScroll: {
    flexGrow: 0,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.bg.primary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.base,
    color: COLORS.text.primary,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    borderColor: COLORS.brand.cyan,
    backgroundColor: 'rgba(0,212,255,0.1)',
  },
  publishBtn: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.brand.green,
  },
  publishBtnText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.bg.primary,
  },
  cancelBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.text.muted,
  },
});
