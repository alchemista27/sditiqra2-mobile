// src/screens/EditPasswordScreen.tsx
// Layar untuk mengubah password pengguna yang sedang login
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../api/services';
import { storage } from '../utils/storage';
import { AxiosError } from 'axios';

interface Props {
  onBack: () => void;
  onLogout?: () => void;
}

interface ApiErrorResponse {
  message?: string;
  code?: string;
}

export default function EditPasswordScreen({ onBack, onLogout }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Peringatan', 'Semua field wajib diisi.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Peringatan', 'Password baru minimal 8 karakter.');
      return;
    }

    if (oldPassword === newPassword) {
      Alert.alert('Peringatan', 'Password baru tidak boleh sama dengan password lama.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Peringatan', 'Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      Alert.alert('Berhasil', 'Password berhasil diubah. Silakan login ulang.', [
        {
          text: 'OK',
          onPress: async () => {
            // Force re-login: hapus token dan kembali ke login screen
            await storage.clearAll();
            if (onLogout) {
              onLogout();
            } else {
              onBack();
            }
          },
        },
      ]);
    } catch (error: unknown) {
      let message = 'Gagal mengubah password.';
      if (error instanceof AxiosError) {
        const data = error.response?.data as ApiErrorResponse | undefined;
        message = data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      Alert.alert('Gagal', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.title}>Ubah Password</Text>
        </View>

        {/* Form Card */}
        <View style={s.card}>
          <View style={s.iconContainer}>
            <MaterialIcons name="lock-outline" size={32} color="#1B6B44" />
          </View>
          <Text style={s.subtitle}>
            Masukkan password lama dan password baru Anda untuk mengubah password akun.
          </Text>

          {/* Password Lama */}
          <Text style={s.label}>Password Lama</Text>
          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              placeholder="Masukkan password lama"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showOld}
              value={oldPassword}
              onChangeText={setOldPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowOld(!showOld)} style={s.eyeBtn}>
              <MaterialIcons
                name={showOld ? 'visibility-off' : 'visibility'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Password Baru */}
          <Text style={s.label}>Password Baru</Text>
          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              placeholder="Masukkan password baru (min. 8 karakter)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={s.eyeBtn}>
              <MaterialIcons
                name={showNew ? 'visibility-off' : 'visibility'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Konfirmasi Password Baru */}
          <Text style={s.label}>Konfirmasi Password Baru</Text>
          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              placeholder="Ulangi password baru"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
              <MaterialIcons
                name={showConfirm ? 'visibility-off' : 'visibility'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="save" size={18} color="#fff" />
                <Text style={s.submitTxt}>Simpan Password</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#0F3D24',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  submitBtn: {
    backgroundColor: '#1B6B44',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
