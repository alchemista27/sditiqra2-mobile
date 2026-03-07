// src/screens/HomeScreen.tsx
// Dashboard utama — clock in/out dengan GPS + face verification
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useLocation } from '../hooks/useLocation';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { attendanceService } from '../api/services';
import { storage } from '../utils/storage';
import { isWithinRadius } from '../utils/gps';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [clockAction, setClockAction] = useState<'in' | 'out'>('in');

  const { location, loading: gpsLoading, error: gpsError, refresh: refreshGps } = useLocation();
  const { cameraRef, hasPermission, requestCameraPermission, captureSelfie, capturing } = useFaceDetection();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await storage.getUser();
      setUser(userData);
      const res = await attendanceService.getMyStatus();
      setStatus(res.data);
    } catch (err: any) {
      console.log('Load status error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGps();
    await loadData();
    setRefreshing(false);
  }, [refreshGps]);

  const handleClockAction = async (action: 'in' | 'out') => {
    if (!location) {
      Alert.alert('GPS Error', 'Lokasi GPS belum tersedia. Coba refresh.');
      return;
    }

    // Check geofencing client-side
    if (status?.config) {
      const check = isWithinRadius(
        location.latitude, location.longitude,
        status.config.schoolLatitude, status.config.schoolLongitude,
        status.config.radiusMeters
      );
      if (!check.isWithin) {
        Alert.alert(
          'Di Luar Radius',
          `Anda berada ${check.distance}m dari sekolah (max: ${status.config.radiusMeters}m). Absensi akan ditandai sebagai anomali.`,
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Lanjut Absen', onPress: () => startCameraCapture(action) },
          ]
        );
        return;
      }
    }

    if (location.isMockGps) {
      Alert.alert('Fake GPS Terdeteksi', 'Anda menggunakan GPS palsu. Absensi tidak dapat dilakukan.');
      return;
    }

    startCameraCapture(action);
  };

  const startCameraCapture = async (action: 'in' | 'out') => {
    setClockAction(action);
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Izin Kamera', 'Izin kamera diperlukan untuk verifikasi wajah.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCapture = async () => {
    const faceResult = await captureSelfie();
    setShowCamera(false);

    if (!faceResult || !location) return;

    // Check face verification result
    if (!faceResult.verified && faceResult.faceDetected) {
      Alert.alert(
        'Verifikasi Wajah Gagal',
        `${faceResult.message}\n\nApakah Anda ingin melanjutkan absensi?`,
        [
          { text: 'Ulangi', style: 'cancel' },
          { text: 'Lanjut', onPress: () => submitClock(faceResult) },
        ]
      );
      return;
    }

    if (!faceResult.faceDetected) {
      Alert.alert('Wajah Tidak Terdeteksi', faceResult.message);
      return;
    }

    await submitClock(faceResult);
  };

  const submitClock = async (faceResult: any) => {
    if (!location) return;
    setClockLoading(true);
    try {
      const gpsData = {
        latitude: location.latitude,
        longitude: location.longitude,
        isMockGps: location.isMockGps,
        faceConfidence: faceResult.confidence,
        selfieUrl: faceResult.selfieUri,
      };

      let res;
      if (clockAction === 'in') {
        res = await attendanceService.clockIn(gpsData);
      } else {
        res = await attendanceService.clockOut(gpsData);
      }

      const confText = faceResult.confidence < 1 ? ` (Face: ${Math.round(faceResult.confidence * 100)}%)` : '';
      Alert.alert('Berhasil', `${res.message}${confText}`);
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      Alert.alert('Gagal', msg);
    } finally {
      setClockLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B6B44" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Memuat...</Text>
      </View>
    );
  }

  // Camera overlay for face capture
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <View style={styles.cameraOverlay}>
            <View style={styles.faceFrame} />
            <Text style={styles.cameraText}>Posisikan wajah Anda dalam bingkai</Text>
            <View style={styles.cameraButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.captureBtn, capturing && { opacity: 0.5 }]}
                onPress={handleCapture}
                disabled={capturing}
              >
                {capturing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.captureInner} />
                )}
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  const formatTime = (t: string | null) => {
    if (!t) return '--:--';
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B6B44']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Assalamu'alaikum <MaterialIcons name="waving-hand" size={14} color="rgba(255,255,255,0.7)" /></Text>
          <Text style={styles.userName}>{user?.name || 'Pengguna'}</Text>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      </View>

      {/* Holiday Banner */}
      {status?.isHoliday && (
        <View style={styles.holidayBanner}>
          <MaterialIcons name="celebration" size={24} color="#92400E" style={{ marginRight: 10 }} />
          <Text style={styles.holidayText}>Hari ini libur: {status.holidayName}</Text>
        </View>
      )}

      {/* GPS Status */}
      <View style={styles.gpsCard}>
        <View style={styles.gpsHeader}>
          <Text style={styles.gpsTitle}><MaterialIcons name="location-pin" size={16} /> Status GPS</Text>
          <TouchableOpacity onPress={refreshGps} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="refresh" size={14} color="#1B6B44" />
            <Text style={styles.refreshText}> Refresh</Text>
          </TouchableOpacity>
        </View>
        {gpsLoading ? (
          <ActivityIndicator color="#1B6B44" style={{ marginVertical: 8 }} />
        ) : gpsError ? (
          <Text style={styles.gpsError}>{gpsError}</Text>
        ) : location ? (
          <View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsLabel}>Koordinat</Text>
              <Text style={styles.gpsValue}>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsLabel}>Akurasi</Text>
              <Text style={styles.gpsValue}>{location.accuracy ? `${Math.round(location.accuracy)}m` : 'N/A'}</Text>
            </View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsLabel}>Mock GPS</Text>
              <Text style={[styles.gpsValue, location.isMockGps ? styles.textDanger : styles.textSuccess]}>
                {location.isMockGps ? <><MaterialIcons name="warning" size={13} /> Terdeteksi</> : <><MaterialIcons name="check-circle" size={13} /> Asli</>}
              </Text>
            </View>
            {status?.config && (
              <View style={styles.gpsRow}>
                <Text style={styles.gpsLabel}>Jarak dari sekolah</Text>
                <Text style={styles.gpsValue}>
                  {(() => {
                    const d = isWithinRadius(
                      location.latitude, location.longitude,
                      status.config.schoolLatitude, status.config.schoolLongitude,
                      status.config.radiusMeters
                    );
                    return (<Text style={d.isWithin ? styles.textSuccess : styles.textDanger}>
                      {d.distance}m {d.isWithin ? <><MaterialIcons name="check-circle" size={13} /> Dalam radius</> : <><MaterialIcons name="warning" size={13} /> Luar radius</>}
                    </Text>) as any;
                  })()}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* Clock In/Out Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Status Hari Ini</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Clock In</Text>
            <Text style={[styles.statusTime, status?.hasClockIn ? styles.textSuccess : styles.textMuted]}>
              {formatTime(status?.clockIn)}
            </Text>
            {status?.isLate && <Text style={styles.lateBadge}>TERLAMBAT</Text>}
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Clock Out</Text>
            <Text style={[styles.statusTime, status?.hasClockOut ? styles.textDanger : styles.textMuted]}>
              {formatTime(status?.clockOut)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {!status?.isHoliday && (
        <View style={styles.actionContainer}>
          {!status?.hasClockIn ? (
            <TouchableOpacity
              style={[styles.clockInBtn, (clockLoading || gpsLoading) && { opacity: 0.6 }]}
              onPress={() => handleClockAction('in')}
              disabled={clockLoading || gpsLoading}
              activeOpacity={0.8}
            >
              {clockLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="login" size={28} color="#fff" style={{ marginBottom: 4 }} />
                  <Text style={styles.clockBtnText}>CLOCK IN</Text>
                  <Text style={styles.clockBtnSub}>Catat kehadiran masuk</Text>
                </>
              )}
            </TouchableOpacity>
          ) : !status?.hasClockOut ? (
            <TouchableOpacity
              style={[styles.clockOutBtn, (clockLoading || gpsLoading) && { opacity: 0.6 }]}
              onPress={() => handleClockAction('out')}
              disabled={clockLoading || gpsLoading}
              activeOpacity={0.8}
            >
              {clockLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="logout" size={28} color="#fff" style={{ marginBottom: 4 }} />
                  <Text style={styles.clockBtnText}>CLOCK OUT</Text>
                  <Text style={styles.clockBtnSub}>Catat kehadiran pulang</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.doneCard}>
              <MaterialIcons name="done-all" size={36} color="#065F46" style={{ marginBottom: 8 }} />
              <Text style={styles.doneText}>Absensi hari ini sudah lengkap!</Text>
              <Text style={styles.doneSub}>
                Masuk: {formatTime(status?.clockIn)} — Pulang: {formatTime(status?.clockOut)}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },

  // Header
  header: { backgroundColor: '#0F3D24', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  userName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 },
  dateBadge: { marginTop: 8 },
  dateText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },

  // Holiday
  holidayBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
    marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12,
  },
  holidayIcon: { fontSize: 24, marginRight: 10 },
  holidayText: { color: '#92400E', fontSize: 14, fontWeight: '600', flex: 1 },

  // GPS
  gpsCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB',
  },
  gpsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gpsTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  refreshText: { color: '#1B6B44', fontSize: 13, fontWeight: '600' },
  gpsError: { color: '#DC2626', fontSize: 13, marginTop: 4 },
  gpsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  gpsLabel: { color: '#6B7280', fontSize: 13 },
  gpsValue: { color: '#111827', fontSize: 13, fontWeight: '500', flexShrink: 1, textAlign: 'right' },

  // Status
  statusCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB',
  },
  statusTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusItem: { flex: 1, alignItems: 'center' },
  statusLabel: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
  statusTime: { fontSize: 28, fontWeight: '800' },
  statusDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  lateBadge: {
    backgroundColor: '#FEF3C7', color: '#92400E', fontSize: 10,
    fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4,
  },

  // Actions
  actionContainer: { marginHorizontal: 16, marginTop: 16 },
  clockInBtn: {
    backgroundColor: '#1B6B44', borderRadius: 20, paddingVertical: 24, alignItems: 'center',
    shadowColor: '#1B6B44', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  clockOutBtn: {
    backgroundColor: '#DC2626', borderRadius: 20, paddingVertical: 24, alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  clockBtnIcon: { fontSize: 28, marginBottom: 4 },
  clockBtnText: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  clockBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  doneCard: {
    backgroundColor: '#D1FAE5', borderRadius: 20, paddingVertical: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#34D399',
  },
  doneIcon: { fontSize: 36, marginBottom: 8 },
  doneText: { color: '#065F46', fontSize: 16, fontWeight: '700' },
  doneSub: { color: '#047857', fontSize: 13, marginTop: 4 },

  // Text helpers
  textSuccess: { color: '#065F46' },
  textDanger: { color: '#DC2626' },
  textMuted: { color: '#9CA3AF' },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  faceFrame: {
    width: 250, height: 320, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 160, marginTop: 40,
  },
  cameraText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  cameraButtons: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 40,
  },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4,
    borderColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  captureInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff',
  },
});
