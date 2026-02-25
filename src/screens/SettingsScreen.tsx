/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Settings Screen
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
  Switch,
} from 'react-native';
import { useStore } from '../services/store';
import { COLORS, SPACING, RADIUS, FONTS, FONT_SIZE } from '../constants/theme';

// ─── Setting Row ───
function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.settingRow}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={[styles.settingLabel, danger && styles.settingDanger]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Section Header ───
function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

// ─── Edit Budget Modal ───
function EditBudgetModal({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [value, setValue] = useState(current.toString());

  const handleSave = () => {
    const amount = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(amount) && amount > 0) {
      onSave(amount);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Monthly Budget</Text>
          <Text style={styles.modalSubtitle}>
            Set how much you plan to spend each month.
          </Text>
          <View style={styles.amountRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
              autoFocus
              selectTextOnFocus
            />
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───
export default function SettingsScreen() {
  const { user, updateBudget } = useStore();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const spentPercent = Math.round((user.spent / user.monthlyBudget) * 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.appLabel}>SETTINGS</Text>
        <Text style={styles.headline}>Preferences</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Profile Card ─── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileId}>User ID: {user.id}</Text>
          </View>
        </View>

        {/* ─── Budget Section ─── */}
        <SectionHeader title="BUDGET" />
        <View style={styles.settingGroup}>
          <SettingRow
            icon="💰"
            label="Monthly Budget"
            value={`$${user.monthlyBudget.toLocaleString()}`}
            onPress={() => setShowBudgetModal(true)}
          />
          <View style={styles.divider} />
          <View style={styles.budgetStatus}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Spent this month</Text>
              <Text
                style={[
                  styles.budgetValue,
                  spentPercent > 80 && styles.budgetWarning,
                  spentPercent >= 100 && styles.budgetDanger,
                ]}
              >
                ${user.spent.toLocaleString()} ({spentPercent}%)
              </Text>
            </View>
            <View style={styles.budgetTrack}>
              <View
                style={[
                  styles.budgetFill,
                  { width: `${Math.min(spentPercent, 100)}%` as any },
                  spentPercent > 80 && styles.budgetFillWarning,
                  spentPercent >= 100 && styles.budgetFillDanger,
                ]}
              />
            </View>
          </View>
        </View>

        {/* ─── Notifications Section ─── */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.settingGroup}>
          <SettingRow
            icon="🔔"
            label="Scan Reminders"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: COLORS.overlay.medium,
                  true: COLORS.brand.green,
                }}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📊"
            label="Weekly Report"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: COLORS.overlay.medium,
                  true: COLORS.brand.green,
                }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ─── App Section ─── */}
        <SectionHeader title="APP" />
        <View style={styles.settingGroup}>
          <SettingRow
            icon="📳"
            label="Haptic Feedback"
            rightElement={
              <Switch
                value={hapticEnabled}
                onValueChange={setHapticEnabled}
                trackColor={{
                  false: COLORS.overlay.medium,
                  true: COLORS.brand.green,
                }}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🌙"
            label="Appearance"
            value="Dark (Default)"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="💵"
            label="Currency"
            value="USD ($)"
          />
        </View>

        {/* ─── About Section ─── */}
        <SectionHeader title="ABOUT" />
        <View style={styles.settingGroup}>
          <SettingRow icon="📋" label="Privacy Policy" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="📄" label="Terms of Service" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="⭐" label="Rate SmartSpend" onPress={() => {}} />
        </View>

        {/* ─── Version ─── */}
        <Text style={styles.version}>SmartSpend v1.0.0</Text>
      </ScrollView>

      {/* ─── Budget Modal ─── */}
      <EditBudgetModal
        visible={showBudgetModal}
        current={user.monthlyBudget}
        onClose={() => setShowBudgetModal(false)}
        onSave={(amount) => {
          updateBudget(amount);
        }}
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

  // ─── Scroll ───
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: 40,
  },

  // ─── Profile Card ───
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginBottom: SPACING.xl,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.overlay.medium,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: FONT_SIZE.xl,
    ...FONTS.heading,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  profileId: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.muted,
    ...FONTS.mono,
  },

  // ─── Section Header ───
  sectionHeader: {
    fontSize: FONT_SIZE.xs,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xl,
  },

  // ─── Setting Group ───
  settingGroup: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingIcon: { fontSize: 18 },
  settingLabel: {
    fontSize: FONT_SIZE.base,
    color: COLORS.text.primary,
    ...FONTS.body,
  },
  settingDanger: { color: COLORS.accent.danger },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingValue: {
    fontSize: FONT_SIZE.base,
    color: COLORS.text.muted,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.text.muted,
    marginTop: -1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.subtle,
    marginLeft: SPACING.xl + 18 + SPACING.md,
  },

  // ─── Budget Status ───
  budgetStatus: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  budgetLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.muted,
  },
  budgetValue: {
    fontSize: FONT_SIZE.sm,
    ...FONTS.mono,
    color: COLORS.brand.green,
  },
  budgetWarning: { color: COLORS.accent.gold },
  budgetDanger: { color: COLORS.accent.danger },
  budgetTrack: {
    height: 4,
    backgroundColor: COLORS.overlay.medium,
    borderRadius: 2,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.brand.green,
  },
  budgetFillWarning: { backgroundColor: COLORS.accent.gold },
  budgetFillDanger: { backgroundColor: COLORS.accent.danger },

  // ─── Version ───
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.disabled,
    ...FONTS.mono,
    marginTop: SPACING['2xl'],
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalBox: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS['2xl'],
    padding: SPACING['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  modalTitle: {
    fontSize: FONT_SIZE['2xl'],
    ...FONTS.heading,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  modalSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.muted,
    marginBottom: SPACING.xl,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  dollarSign: {
    fontSize: FONT_SIZE['3xl'],
    ...FONTS.mono,
    color: COLORS.brand.green,
    marginRight: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE['3xl'],
    ...FONTS.mono,
    color: COLORS.text.primary,
    paddingVertical: SPACING.lg,
  },
  modalButtons: {
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
  cancelBtnText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.text.muted,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.brand.green,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.heading,
    color: COLORS.bg.primary,
  },
});
