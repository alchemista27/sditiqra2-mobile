// src/screens/FaceRegisterScreen.tsx
// Halaman registrasi wajah — satu kali setup di awal
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { initTF, isReady } from '../utils/faceEngine';
import { storage } from '../utils/storage';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export default function FaceRegisterScreen({ onComplete, onSkip }: Props) {
  const [tfLoading, setTfLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const { cameraRef, hasPermission, requestCameraPermission, registerFromCamera, capturing } = useFaceDetection();

  useEffect(() => {
    (async () => {
      // Check if already registered
      const emb = await storage.getFaceEmbedding();
      if (emb) { setRegistered(true); }
      // Init TF.js
      await initTF();
      setTfLoading(false);
    })();
  }, []);

  const handleOpenCamera = async () => {
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Izin Kamera', 'Izin kamera diperlukan untuk mendaftarkan wajah.');
        return;
      }
    }
    setShowCamera(true);
    setPreviewUri(null);
  };

  const handleCapture = async () => {
    const result = await registerFromCamera();
    setShowCamera(false);
    if (result) {
      setPreviewUri(result.selfieUri);
      if (result.verified) {
        setRegistered(true);
        Alert.alert('Berhasil', result.message);
      } else {
        Alert.alert('Gagal', result.message);
      }
    }
  };

  const handleReset = async () => {
    Alert.alert('Reset Wajah', 'Hapus data wajah yang terdaftar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await storage.setFaceEmbedding([]);
        setRegistered(false);
        setPreviewUri(null);
      }},
    ]);
  };

  if (showCamera) {
    return (
      <View style={s.cameraWrap}>
        <CameraView ref={cameraRef} style={s.camera} facing="front">
          <View style={s.cameraOverlay}>
            <Text style={s.cameraTitle}><MaterialIcons name="camera-alt" size={18} /> Registrasi Wajah</Text>
            <View style={s.faceFrame} />
            <Text style={s.cameraHint}>
              Posisikan wajah Anda dalam bingkai{'\n'}
              Pastikan pencahayaan cukup
            </Text>
            <View style={s.cameraActions}>
              <TouchableOpacity style={s.camCancel} onPress={() => setShowCamera(false)}>
                <Text style={s.camCancelTxt}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.captureBtn, capturing && { opacity: 0.5 }]}
                onPress={handleCapture}
                disabled={capturing}
              >
                {capturing ? <ActivityIndicator color="#fff" /> : <View style={s.captureInner} />}
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Registrasi Wajah</Text>
      </View>

      <View style={s.content}>
        {/* TF Loading */}
        {tfLoading ? (
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color="#1B6B44" />
            <Text style={s.loadingText}>Memuat model AI...</Text>
            <Text style={s.loadingHint}>TensorFlow.js + BlazeFace sedang dimuat</Text>
          </View>
        ) : (
          <>
            {/* Status */}
            <View style={[s.statusCard, registered ? s.statusDone : s.statusPending]}>
              <MaterialIcons name={registered ? "check-circle" : "warning"} size={36} color={registered ? "#065F46" : "#92400E"} style={{ marginBottom: 8 }} />
              <Text style={s.statusText}>
                {registered ? 'Wajah Anda sudah terdaftar' : 'Wajah belum didaftarkan'}
              </Text>
              <Text style={s.statusHint}>
                {registered
                  ? 'Wajah Anda akan diverifikasi setiap kali melakukan absensi'
                  : 'Daftarkan wajah Anda untuk verifikasi absensi'}
              </Text>
            </View>

            {/* Preview */}
            {previewUri && (
              <View style={s.previewCard}>
                <Image source={{ uri: previewUri }} style={s.previewImg} />
                <Text style={s.previewLabel}>Foto terdaftar</Text>
              </View>
            )}

            {/* Actions */}
            <View style={s.actionsList}>
              {!registered ? (
                <TouchableOpacity style={s.registerBtn} onPress={handleOpenCamera} activeOpacity={0.8}>
                  <MaterialIcons name="camera-alt" size={28} color="#fff" style={{ marginBottom: 4 }} />
                  <Text style={s.registerTxt}>Daftarkan Wajah Saya</Text>
                  <Text style={s.registerHint}>Ambil foto wajah untuk registrasi</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={s.reRegBtn} onPress={handleOpenCamera} activeOpacity={0.8}>
                    <Text style={s.reRegTxt}><MaterialIcons name="refresh" size={14} /> Daftarkan Ulang Wajah</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
                    <Text style={s.resetTxt}><MaterialIcons name="delete" size={13} /> Hapus Data Wajah</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Info */}
            <View style={s.infoCard}>
              <Text style={s.infoTitle}><MaterialIcons name="info" size={13} /> Tentang Face Recognition</Text>
              <Text style={s.infoText}>
                • Pemrosesan wajah dilakukan 100% di perangkat Anda{'\n'}
                • Data wajah TIDAK dikirim ke server{'\n'}
                • Menggunakan TensorFlow.js + BlazeFace{'\n'}
                • Pastikan pencahayaan cukup saat foto
              </Text>
            </View>
          </>
        )}

        {/* Bottom buttons */}
        <View style={s.bottomActions}>
          {registered && (
            <TouchableOpacity style={s.doneBtn} onPress={onComplete} activeOpacity={0.8}>
              <Text style={s.doneTxt}><MaterialIcons name="check" size={15} /> Selesai</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.skipBtn} onPress={onSkip}>
            <Text style={s.skipTxt}>Lewati untuk sekarang →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#0F3D24', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  loadingCard: { alignItems: 'center', marginTop: 60 },
  loadingText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  loadingHint: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  statusCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  statusDone: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#34D399' },
  statusPending: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FBBF24' },
  statusIcon: { fontSize: 36, marginBottom: 8 },
  statusText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusHint: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },

  previewCard: { alignItems: 'center', marginBottom: 16 },
  previewImg: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#34D399' },
  previewLabel: { fontSize: 12, color: '#6B7280', marginTop: 8 },

  actionsList: { gap: 8, marginBottom: 16 },
  registerBtn: {
    backgroundColor: '#1B6B44', borderRadius: 16, paddingVertical: 20, alignItems: 'center',
    shadowColor: '#1B6B44', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  registerIcon: { fontSize: 28, marginBottom: 4 },
  registerTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  registerHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  reRegBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  reRegTxt: { color: '#374151', fontSize: 14, fontWeight: '600' },
  resetBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  resetTxt: { color: '#DC2626', fontSize: 13, fontWeight: '600' },

  infoCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF', marginBottom: 6 },
  infoText: { fontSize: 12, color: '#1E40AF', lineHeight: 20 },

  bottomActions: { marginTop: 'auto', paddingBottom: 32, gap: 8 },
  doneBtn: { backgroundColor: '#1B6B44', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  doneTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipTxt: { color: '#6B7280', fontSize: 13, fontWeight: '500' },

  // Camera
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  cameraTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  faceFrame: { width: 250, height: 320, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 160 },
  cameraHint: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  cameraActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 40 },
  camCancel: { padding: 12 },
  camCancelTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
});
