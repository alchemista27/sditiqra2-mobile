// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LeaveScreen from '../screens/LeaveScreen';
import FaceRegisterScreen from '../screens/FaceRegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const drawerIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  Attendance: 'history',
  Leave: 'assignment',
  FaceReg: 'face',
  Profile: 'person',
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
        headerShown: true,
        headerStyle: { backgroundColor: '#0F3D24' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarIcon: ({ color, size, focused }) => (
          <MaterialIcons name={drawerIcons[route.name]} size={size} color={color} />
        ),
        tabBarLabel: ({ color, focused }) => (
          <Text style={{ color, fontSize: 11, fontWeight: focused ? '700' : '500', marginBottom: 4 }}>
            {tabLabels[route.name]}
          </Text>
        ),
        tabBarActiveTintColor: '#1B6B44',
        tabBarInactiveTintColor: '#4B5563',
        tabBarStyle: {
          height: 60,
          paddingTop: 8,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Beranda' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Riwayat Absensi' }} />
      <Tab.Screen name="Leave" component={LeaveScreen} options={{ title: 'Izin & Cuti' }} />
      <Tab.Screen name="FaceReg" options={{ title: 'Verifikasi Wajah' }}>
        {() => <FaceRegisterScreen onComplete={() => {}} onSkip={() => {}} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ title: 'Profil Anda' }}>
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

