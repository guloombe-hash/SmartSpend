/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Goals Screen
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useStore } from '../services/store';
import { COLORS, SPACING, RADIUS, FONTS, FONT_SIZE } from '../constants/theme';
import type { UserGoal } from '../types';

// ─── Goal Card ───
function GoalCard({ goal, onPress }: { goal: UserGoal; onPress: () => void }) {
  const percent = Math.min(
    Math.round((goal.savedAmount / goal.targetAmount) * 100),
    100
  );
  const remaining = goal.targetAmount - goal.savedAmount;

  const daysLeft = goal.deadline
    ? Math.ceil(
        (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.goalCard}
    >
      <View style={styles.goalCardHeader}>
        <View style={styles.goalLeft}>
          <View style={styles.goalIconWrap}>
            <Text style={{ fontSize: 24 }}>{goal.icon}</Text>
          </View>
          <View>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {daysLeft !== null && (
              <Text style={styles.goalDeadline}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.goalRight}>
          <Text style={styles.goalPercent}>{percent}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${percent}%` as any },
            percent >= 100 && styles.progressComplete,
          ]}
        />
      </View>

      {/* Amount Row */}
      <View style={styles.goalAmounts}>
        <Text style={styles.savedAmount}>
          ${goal.savedAmount.toLocaleString()} saved
        </Text>
        <Text style={styles.remainingAmount}>
          ${remaining > 0 ? remaining.toLocaleString() : '0'} to go
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Add Goal Modal ───
const GOAL_TEMPLATES = [
  { icon: '✈️', label: 'Trip / Travel' },
  { icon: '💻', label: 'Tech / Gadget' },
  { icon: '🎓', label: 'Education' },
  { icon: '🏋️', label: 'Fitness' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '🎁', label: 'Gift' },
  { icon: '🏠', label: 'Home' },
  { icon: '🚗', label: 'Car' },
];

function AddGoalModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: Omit<UserGoal, 'id' | 'createdAt'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');

  const handleSave = () => {
    if (!title.trim() || !amount.trim()) return;
    const target = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(target) || target <= 0) return;

    onSave({
      title: title.trim(),
      icon: selectedIcon,
      targetAmount: target,
      savedAmount: 0,
    });

    setTitle('');
    setAmount('');
    setSelectedIcon('🎯');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>New Goal</Text>

          {/* Icon Picker */}
          <Text style={styles.inputLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.iconScroll}
            contentContainerStyle={styles.iconScrollContent}
          >
            {GOAL_TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.icon}
                onPress={() => setSelectedIcon(t.icon)}
                style={[
                  styles.iconOption,
                  selectedIcon === t.icon && styles.iconOptionSelected,
                ]}
              >
                <Text style={{ fontSize: 22 }}>{t.icon}</Text>
                <Text style={styles.iconOptionLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title Input */}
          <Text style={styles.inputLabel}>Goal Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Japan Trip Fund"
            placeholderTextColor={COLORS.text.disabled}
            value={title}
            onChangeText={setTitle}
            maxLength={40}
          />

          {/* Amount Input */}
          <Text style={styles.inputLabel}>Target Amount ($)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 3000"
            placeholderTextColor={COLORS.text.disabled}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveBtn,
                (!title.trim() || !amount.trim()) && styles.saveBtnDisabled,
              ]}
            >
              <Text style={styles.saveBtnText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───
export default function GoalsScreen() {
  const { user, addGoal } = useStore();
  const [showModal, setShowModal] = useState(false);

  const totalSaved = user.goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = user.goals.reduce((s, g) => s + g.targetAmount, 0);
  const completedGoals = user.goals.filter(
    (g) => g.savedAmount >= g.targetAmount
  ).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.appLabel}>GOALS</Text>
        <Text style={styles.headline}>Your Savings</Text>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Summary Card ─── */}
      {user.goals.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              ${totalSaved.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Saved</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              ${totalTarget.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Target</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.brand.cyan }]}>
              {completedGoals}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>
      )}

      {/* ─── Goals List ─── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {user.goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>
              Set a savings goal to stay motivated when scanning items.
            </Text>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={styles.emptyBtn}
            >
              <Text style={styles.emptyBtnText}>Create First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          user.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onPress={() => {}} />
          ))
        )}
      </ScrollView>

      {/* ─── Add Goal Modal ─── */}
      <AddGoalModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={addGoal}
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
  },
  addBtn: {
    position: 'absolute',
    right: SPACING['2xl'],
    top: SPACING.lg,
    backgroundColor: COLORS.overlay.brand,
    borderWidth: 1,
    borderColor: COLORS.border.brand,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  addBtnText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.brand.green,
  },

  // ─── Summary ───
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING['2xl'],
    marginBottom: SPACING['2xl'],
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: SPACING.xl,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: 4,
  },
  summaryValue: {
    fontSize: FONT_SIZE['2xl'],
    ...FONTS.mono,
    color: COLORS.brand.green,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.muted,
    ...FONTS.caption,
  },

  // ─── Scroll ───
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: 40,
  },

  // ─── Goal Card ───
  goalCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginBottom: SPACING.lg,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  goalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.overlay.brand,
    borderWidth: 1,
    borderColor: COLORS.border.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: FONT_SIZE.lg,
    ...FONTS.subheading,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  goalDeadline: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.muted,
  },
  goalRight: { alignItems: 'flex-end' },
  goalPercent: {
    fontSize: FONT_SIZE.xl,
    ...FONTS.mono,
    color: COLORS.brand.green,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.overlay.medium,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.brand.green,
  },
  progressComplete: {
    backgroundColor: COLORS.brand.cyan,
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savedAmount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.brand.green,
    ...FONTS.caption,
  },
  remainingAmount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.muted,
    ...FONTS.caption,
  },

  // ─── Empty State ───
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.xl },
  emptyTitle: {
    fontSize: FONT_SIZE['2xl'],
    ...FONTS.heading,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
    marginBottom: SPACING['2xl'],
  },
  emptyBtn: {
    backgroundColor: COLORS.overlay.brand,
    borderWidth: 1,
    borderColor: COLORS.border.brand,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  emptyBtnText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.brand.green,
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalSheet: {
    backgroundColor: COLORS.bg.secondary,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING['2xl'],
    borderTopWidth: 1,
    borderColor: COLORS.border.light,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZE['2xl'],
    ...FONTS.heading,
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  iconScroll: { marginBottom: SPACING.xl },
  iconScrollContent: { gap: SPACING.sm },
  iconOption: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    minWidth: 72,
    gap: SPACING.xs,
  },
  iconOptionSelected: {
    backgroundColor: COLORS.overlay.brand,
    borderColor: COLORS.border.brand,
  },
  iconOptionLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.muted,
    ...FONTS.caption,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.base,
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
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
  cancelBtnText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.text.muted,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.brand.green,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.heading,
    color: COLORS.bg.primary,
  },
});
