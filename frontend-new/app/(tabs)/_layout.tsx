import { Tabs } from 'expo-router';
import React from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TAB_ICON_SIZE = 24;

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 4,
          height: isMobile ? 56 : 64,
        },
        tabBarLabelStyle: {
          fontSize: isMobile ? 10 : 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: isMobile ? -2 : 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bank" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color }) => (
            <Ionicons name="card" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="beneficiaries"
        options={{
          title: 'Beneficiaries',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
