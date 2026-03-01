/**
 * SmartSpend AI — Navigation
 *
 * Structure:
 *   RootStack
 *     └── Auth           (login/signup — shown when not authenticated)
 *     └── MainTabs (Bottom Tab Navigator — shown when authenticated)
 *           ├── Home
 *           ├── Goals
 *           ├── Social
 *           └── Settings
 *     └── Scanner  (full-screen modal)
 *     └── ProductResult
 */

import React, { useEffect } from 'react';
import { Text, View, Platform, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import type { RootStackParamList, MainTabParamList } from '../types';
import { COLORS, FONT_SIZE, SPACING } from '../constants/theme';
import { useStore } from '../services/store';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ProductResultScreen from '../screens/ProductResultScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SocialScreen from '../screens/SocialScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab Icon ───
function TabIcon({
  icon,
  label,
  focused,
}: {
  icon: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{icon}</Text>
      <Text
        style={{
          fontSize: FONT_SIZE.xs,
          fontWeight: '600',
          color: focused ? COLORS.brand.green : COLORS.text.muted,
          opacity: focused ? 1 : 0.4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Loading Screen ───
function LoadingScreen() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: COLORS.bg.primary,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <ActivityIndicator size="large" color={COLORS.brand.green} />
      <Text style={{ color: COLORS.text.muted, fontSize: FONT_SIZE.md }}>
        Loading...
      </Text>
    </View>
  );
}

// ─── Bottom Tab Navigator ───
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.bg.primary,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.04)',
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : SPACING.lg,
          paddingTop: SPACING.lg,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" label="Goals" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏆" label="Social" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚙️" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ───
export default function AppNavigator() {
  const { authUser, isAuthInitialized, initAuthListener } = useStore();

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, []);

  // Show loading while Firebase checks auth state
  if (!isAuthInitialized) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg.primary },
        }}
      >
        {authUser ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="Scanner"
              component={ScannerScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="ProductResult"
              component={ProductResultScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ animation: 'fade' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
