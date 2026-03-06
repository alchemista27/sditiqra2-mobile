// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LeaveScreen from '../screens/LeaveScreen';
import FaceRegisterScreen from '../screens/FaceRegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const tabIcons: Record<string, string> = {
  Home: '🏠',
  Attendance: '📋',
  Leave: '📝',
  FaceReg: '🤳',
  Profile: '👤',
};

const tabLabels: Record<string, string> = {
  Home: 'Beranda',
  Attendance: 'Riwayat',
  Leave: 'Izin',
  FaceReg: 'Wajah',
  Profile: 'Profil',
};

interface Props { onLogout: () => void; }

export default function AppNavigator({ onLogout }: Props) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <View style={[styles.iconWrap, focused && styles.iconActive]}>
            <Text style={{ fontSize: 20 }}>{tabIcons[route.name]}</Text>
          </View>
        ),
        tabBarLabel: ({ focused }) => (
          <Text style={[styles.label, focused && styles.labelActive]}>
            {tabLabels[route.name]}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Leave" component={LeaveScreen} />
      <Tab.Screen name="FaceReg">
        {() => <FaceRegisterScreen onComplete={() => {}} onSkip={() => {}} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 70,
    paddingBottom: 8,
    paddingTop: 6,
  },
  iconWrap: {
    width: 40, height: 32, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12,
  },
  iconActive: { backgroundColor: '#D1FAE5' },
  label: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginTop: -2 },
  labelActive: { color: '#1B6B44', fontWeight: '700' },
});
