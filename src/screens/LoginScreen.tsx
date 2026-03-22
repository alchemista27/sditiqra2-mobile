// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image
} from 'react-native';
import { authService, cmsService } from '../api/services';
import { storage } from '../utils/storage';
import { API_BASE_URL } from '../api/config';

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  React.useEffect(() => {
    // Fetch CMS settings to get the public logo
    // cmsService.getSettings() now returns the settings object directly: { site_logo: "url", ... }
    cmsService.getSettings()
      .then((data: Record<string, string>) => {
        const url = data?.site_logo;
        if (url) {
          setLogoUrl(url.startsWith('http') ? url : `${API_BASE_URL.replace('/api', '')}${url}`);
        }
      })
      .catch(err => console.log('Silently failed to load CMS settings:', err));
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Perhatian', 'Email dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(email.trim(), password);
      await storage.setToken(res.data.token);
      await storage.setUser(res.data.user);
      onLogin();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login gagal';
      Alert.alert('Login Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {logoUrl ? (
             <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <View style={styles.logo}>
              <Text style={styles.logoText}>I2</Text>
            </View>
          )}
          <Text style={styles.schoolName}>SDIT Iqra 2</Text>
          <Text style={styles.subtitle}>Sistem Absensi Digital</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Masuk ke Akun Anda</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="contoh@sditiqra2.sch.id"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={{ color: '#1B6B44', fontSize: 13, fontWeight: '600' }}>
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          SDIT Iqra 2 Kota Bengkulu{'\n'}
          <Text style={{ fontSize: 11 }}>v1.0 — Sistem Absensi GPS</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F3D24' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoImage: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#2D9164', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  schoolName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 12 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14,
  },
  button: {
    backgroundColor: '#1B6B44', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#1B6B44', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 32, fontSize: 12 },
});
