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
      console.log('[useLocation] Meminta izin lokasi foreground...');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[useLocation] Status izin lokasi:', status);
        if (status !== 'granted') {
          console.warn('[useLocation] Izin lokasi DITOLAK, status:', status);
          setError('Izin lokasi GPS ditolak. Harap izinkan akses lokasi di pengaturan.');
          return;
        }
        setPermissionGranted(true);
        console.log('[useLocation] Izin lokasi diberikan.');
      } catch (permErr: any) {
        console.error('[useLocation] Error saat meminta izin:', permErr.message, permErr);
        setError(`Gagal meminta izin lokasi: ${permErr.message}`);
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    if (!permissionGranted) {
      console.warn('[useLocation] refresh() dipanggil tapi izin belum diberikan.');
      setError('Izin lokasi GPS belum diberikan.');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('[useLocation] Memulai fetch lokasi GPS...');

    try {
      // Cek apakah GPS aktif
      const enabled = await Location.hasServicesEnabledAsync();
      console.log('[useLocation] GPS services enabled:', enabled);
      if (!enabled) {
        console.warn('[useLocation] GPS tidak aktif di perangkat.');
        setError('GPS tidak aktif. Harap nyalakan GPS Anda.');
        setLoading(false);
        return;
      }

      // Ambil lokasi dengan akurasi tinggi
      console.log('[useLocation] Memanggil getCurrentPositionAsync (High accuracy)...');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log('[useLocation] Lokasi diterima:', {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp,
      });

      // Detect mock GPS (Android)
      let isMockGps = false;
      if (Platform.OS === 'android') {
        // Android: check if the location is mocked
        isMockGps = (loc as any).mocked === true;
        console.log('[useLocation] Android mocked GPS:', isMockGps);
      }

      // Additional checks:
      // 1. Accuracy terlalu rendah (> 100m) bisa indikasi fake GPS
      // 2. Device bukan physical device
      if (!Device.isDevice) {
        isMockGps = true; // Emulator/simulator
        console.log('[useLocation] Bukan physical device, isMockGps set true.');
      }

      const locationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        isMockGps,
        timestamp: loc.timestamp,
      };
      setLocation(locationData);
      console.log('[useLocation] Location state diupdate:', locationData);
    } catch (err: any) {
      console.error('[useLocation] ERROR saat fetch lokasi:', err.message, err);
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
