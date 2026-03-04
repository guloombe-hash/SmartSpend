/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Auth Screen (Login / Sign Up)
 * ─────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS, FONT_SIZE } from '../constants/theme';
import { useStore } from '../services/store';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, skipLogin, isAuthLoading } = useStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        Alert.alert('Missing Name', 'Please enter your name.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak Password', 'Password must be at least 6 characters.');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }
    } catch (error: any) {
      const message = getAuthErrorMessage(error.code || error.message);
      Alert.alert('Authentication Error', message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.message !== 'Google Sign-In cancelled') {
        Alert.alert('Sign In Error', error.message || 'Google sign in failed.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>SMARTSPEND</Text>
          <Text style={styles.tagline}>
            Think before you spend.{'\n'}
            <Text style={styles.taglineAccent}>Save smarter.</Text>
          </Text>
        </View>

        {/* Mode Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setMode('login')}
            style={[styles.tab, mode === 'login' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('signup')}
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={COLORS.text.disabled}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.text.disabled}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor={COLORS.text.disabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor={COLORS.text.disabled}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitBtn, isAuthLoading && { opacity: 0.6 }]}
            disabled={isAuthLoading}
          >
            {isAuthLoading ? (
              <ActivityIndicator color={COLORS.bg.primary} />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          style={styles.socialBtn}
          disabled={isAuthLoading}
        >
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.socialBtn} disabled={isAuthLoading}>
            <Text style={styles.socialIcon}></Text>
            <Text style={styles.socialText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

        {/* Skip Login */}
        <TouchableOpacity onPress={skipLogin} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip — Try Demo Mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return code || 'Something went wrong. Please try again.';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING['3xl'],
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: SPACING['4xl'],
  },

  // Header
  header: {
    marginBottom: SPACING['4xl'],
  },
  logo: {
    fontSize: FONT_SIZE.base,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 3,
    marginBottom: SPACING.md,
  },
  tagline: {
    fontSize: FONT_SIZE['3xl'],
    ...FONTS.heading,
    color: COLORS.text.primary,
    lineHeight: 32,
  },
  taglineAccent: {
    color: COLORS.brand.green,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlay.light,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING['2xl'],
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.bg.tertiary,
  },
  tabText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.text.muted,
  },
  tabTextActive: {
    color: COLORS.text.primary,
  },

  // Form
  form: {
    marginBottom: SPACING['2xl'],
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    ...FONTS.mono,
    color: COLORS.text.muted,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
    ...FONTS.body,
  },
  submitBtn: {
    backgroundColor: COLORS.brand.green,
    paddingVertical: SPACING.lg + 2,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitText: {
    fontSize: FONT_SIZE.lg,
    ...FONTS.heading,
    color: COLORS.bg.primary,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border.light,
  },
  dividerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.muted,
    ...FONTS.caption,
    marginHorizontal: SPACING.lg,
  },

  // Social
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlay.light,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  socialIcon: {
    fontSize: FONT_SIZE.xl,
    ...FONTS.heading,
    color: COLORS.text.primary,
  },
  socialText: {
    fontSize: FONT_SIZE.base,
    ...FONTS.subheading,
    color: COLORS.text.secondary,
  },

  // Skip
  skipBtn: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  skipText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.text.muted,
    ...FONTS.caption,
    textDecorationLine: 'underline',
  },
});
