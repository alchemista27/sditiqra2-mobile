// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { storage } from '../utils/storage';

interface Props { onLogout: () => void; }

export default function ProfileScreen({ onLogout }: Props) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => { const u = await storage.getUser(); setUser(u); })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => { await storage.clearAll(); onLogout(); } },
    ]);
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Profil Saya</Text>
      </View>
      <View style={s.card}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{user?.name?.[0] || 'U'}</Text></View>
        <Text style={s.name}>{user?.name || '-'}</Text>
        <Text style={s.email}>{user?.email || '-'}</Text>
        <View style={[s.roleBadge, { backgroundColor: '#D1FAE5' }]}>
          <Text style={{ color: '#065F46', fontSize: 12, fontWeight: '700' }}>{user?.role?.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={s.section}>
        <View style={s.row}><Text style={s.rowLabel}>Versi Aplikasi</Text><Text style={s.rowVal}>1.0.0</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Platform</Text><Text style={s.rowVal}>Expo / React Native</Text></View>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={s.logoutTxt}>🚪 Keluar dari Akun</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#0F3D24', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -1, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1B6B44', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarTxt: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 14, color: '#374151' },
  rowVal: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#FEE2E2', marginHorizontal: 16, marginTop: 16, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutTxt: { color: '#991B1B', fontSize: 15, fontWeight: '700' },
});
