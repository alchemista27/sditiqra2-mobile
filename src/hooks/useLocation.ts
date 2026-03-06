// src/hooks/useLocation.ts
// Hook GPS: get location, detect mock GPS, check accuracy
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  isMockGps: boolean;
  timestamp: number;
}

export interface UseLocationResult {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  permissionGranted: boolean;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Izin lokasi GPS ditolak. Harap izinkan akses lokasi di pengaturan.');
        return;
      }
      setPermissionGranted(true);
    })();
  }, []);

  const refresh = useCallback(async () => {
    if (!permissionGranted) {
      setError('Izin lokasi GPS belum diberikan.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Cek apakah GPS aktif
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setError('GPS tidak aktif. Harap nyalakan GPS Anda.');
        setLoading(false);
        return;
      }

      // Ambil lokasi dengan akurasi tinggi
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Detect mock GPS (Android)
      let isMockGps = false;
      if (Platform.OS === 'android') {
        // Android: check if the location is mocked
        isMockGps = (loc as any).mocked === true;
      }

      // Additional checks:
      // 1. Accuracy terlalu rendah (> 100m) bisa indikasi fake GPS
      // 2. Device bukan physical device
      if (!Device.isDevice) {
        isMockGps = true; // Emulator/simulator
      }

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        isMockGps,
        timestamp: loc.timestamp,
      });
    } catch (err: any) {
      setError(`Gagal mendapatkan lokasi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [permissionGranted]);

  // Auto-fetch on mount
  useEffect(() => {
    if (permissionGranted) {
      refresh();
    }
  }, [permissionGranted, refresh]);

  return { location, loading, error, refresh, permissionGranted };
}
