// src/navigation/AppNavigator.tsx
// Drawer (sidebar) navigator menggantikan bottom tab untuk menghindari
// overlap dengan tombol Home/Back di Android gesture bar
import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerToggleButton,
} from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LeaveScreen from '../screens/LeaveScreen';
import FaceRegisterScreen from '../screens/FaceRegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { storage } from '../utils/storage';
import { cmsService } from '../api/services';
import { API_BASE_URL } from '../api/config';

const Drawer = createDrawerNavigator();

// ───────────────────────────────────────────
// Custom Drawer Content (sidebar)
// ───────────────────────────────────────────
interface DrawerProps extends DrawerContentComponentProps {
  onLogout: () => void;
  logoUrl: string | null;
}

function CustomDrawerContent({ onLogout, logoUrl, ...props }: DrawerProps) {
  const insets = useSafeAreaInsets();

  const handleLogout = useCallback(() => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await storage.clearAll();
          onLogout();
        },
      },
    ]);
  }, [onLogout]);

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.logoCircle}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <MaterialIcons name="school" size={36} color="#fff" />
          )}
        </View>
        <Text style={styles.drawerTitle}>SDIT Iqra 2</Text>
        <Text style={styles.drawerSubtitle}>Sistem Absensi Digital</Text>
      </View>

      {/* Nav Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { paddingBottom: insets.bottom + 16 }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <MaterialIcons name="logout" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ───────────────────────────────────────────
// App Navigator
// ───────────────────────────────────────────
interface Props { onLogout: () => void; }

export default function AppNavigator({ onLogout }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    cmsService.getSettings()
      .then((data: Record<string, string>) => {
        const url = data?.site_logo;
        if (url) {
          setLogoUrl(url.startsWith('http') ? url : `${API_BASE_URL.replace('/api', '')}${url}`);
        }
      })
      .catch(err => console.log('[AppNavigator] Gagal memuat logo:', err));
  }, []);

  const drawerContent = useCallback(
    (props: DrawerContentComponentProps) => (
      <CustomDrawerContent {...props} onLogout={onLogout} logoUrl={logoUrl} />
    ),
    [onLogout, logoUrl]
  );

  return (
    <Drawer.Navigator
      drawerContent={drawerContent}
      screenOptions={{
        headerLeft: () => <DrawerToggleButton tintColor="#fff" />,
        headerStyle: { backgroundColor: '#0F3D24' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerActiveTintColor: '#1B6B44',
        drawerInactiveTintColor: '#4B5563',
        drawerActiveBackgroundColor: '#D1FAE5',
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '600',
          marginLeft: -8,
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 12,
          marginVertical: 2,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Beranda',
          drawerLabel: 'Beranda',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          title: 'Riwayat Absensi',
          drawerLabel: 'Riwayat Absensi',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Leave"
        component={LeaveScreen}
        options={{
          title: 'Izin & Cuti',
          drawerLabel: 'Izin & Cuti',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="assignment" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="FaceReg"
        options={{
          title: 'Verifikasi Wajah',
          drawerLabel: 'Verifikasi Wajah',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="face" size={size} color={color} />
          ),
        }}
      >
        {() => <FaceRegisterScreen onComplete={() => {}} onSkip={() => {}} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Profile"
        options={{
          title: 'Profil Anda',
          drawerLabel: 'Profil',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      >
        {() => <ProfileScreen onLogout={onLogout} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

// ───────────────────────────────────────────
// Styles
// ───────────────────────────────────────────
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    backgroundColor: '#0F3D24',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  drawerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drawerSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
});
