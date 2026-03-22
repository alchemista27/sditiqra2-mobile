# Sistem Absensi GPS — Mobile App (React Native/Expo)

Aplikasi mobile resmi untuk presensi guru dan karyawan SD Islam Terpadu Iqra 2 Kota Bengkulu. 
Aplikasi ini merupakan satu dari tiga pilar sistem digital sekolah (bersama dengan Portal PPDB dan Web CMS). Dikhususkan untuk menangani *tracking* kehadiran pegawai secara *real-time*.

Aplikasi ini menggunakan teknologi GPS Geofencing untuk mendeteksi lokasi kehadiran, fitur Anti-Fake GPS, serta deteksi wajah (Face Recognition) menggunakan TensorFlow.js yang berjalan sepenuhnya 100% secara offline di perangkat pengguna (client-side) tanpa membebani server.

## Fitur Utama

- **Autentikasi Aman:** Login menggunakan NIK dan sinkronisasi otomatis menggunakan Bearer Token.
- **GPS Geofencing:** Memastikan absensi hanya bisa dilakukan jika guru berada di dalam radius sekolah yang diatur melalui Admin Dashboard.
- **Deteksi Anti-Fake GPS:** Menolak absensi secara cerdas jika mendeteksi penggunaan aplikasi manipulasi koordinat/lokasi palsu.
- **Face Verification (TensorFlow.js):** Pendaftaran dan verifikasi wajah (*enrollment & recognition*) berlangsung langsung di HP menggunakan BlazeFace Movenet tanpa memerlukan proses server.
- **Pengajuan Izin/Cuti:** Guru dapat mengajukan permohonan sakit/izin dengan menyertakan catatan.
- **Riwayat Absensi:** Laporan rekam jejak jam masuk dan keluar secara langsung (*real-time*).

## Struktur Navigasi

Aplikasi ini menggunakan sistem **Bottom Tabs Navigation** yang ringan dan stabil.
1. **Beranda:** Halaman utama menampilkan kartu absensi hari ini, deteksi lokasi GPS saat ini, dan status verifikasi wajah.
2. **Riwayat:** Rekapitulasi kalender kehadiran bulan ini.
3. **Izin:** Formulir pengajuan izin dan cuti ke kepala sekolah/admin.
4. **Wajah:** Halaman khusus pendaftaran atau pembaruan rekam data wajah.
5. **Profil:** Info pengguna dan menu log out.

## Panduan Instalasi Lokal (Developer)

1. Pastikan Node.js (v24+) dan Expo CLI telah terpasang.
2. Masuk ke direktori mobile: `cd apps/mobile`
3. Install dependencies: `npm install`
4. Jalankan Metro Bundler: `npx expo start`
5. Gunakan aplikasi **Expo Go** di perangkat Android/iOS fisik untuk memindai QR Code atau menghubungkan melalui URL. 
   > **Catatan:** Fitur Face Recognition dan Sensor Deteksi Mock GPS membutuhkan kamera dan sensor perangkat fisik untuk berfungsi maksimal. Emulator PC tidak direkomendasikan.

## Stack Teknologi
- Framework: React Native (Expo Managed Workflow)
- AI Model: `@tensorflow/tfjs-react-native` + `blazeface`
- GPS Module: `expo-location`
- Navigation: `@react-navigation/bottom-tabs`
- Storage: `AsyncStorage`

## Panduan Debugging (Expo Go)

Error dari React Native kadang hanya muncul di UI Expo Go dan tidak terlihat di terminal. Gunakan cara berikut untuk menampilkan log secara penuh di komputer.

### 1. Lihat Log via Metro Bundler
Semua `console.log` / `console.error` akan tampil di terminal Metro saat debugging:
```bash
npx expo start --dev
```
Seluruh file sudah menggunakan prefix `[useLocation]`, `[HomeScreen]`, dll. untuk memudahkan filter log.

### 2. Android — ADB Logcat
Sambungkan perangkat Android via USB (dengan USB Debugging aktif) lalu jalankan:
```bash
adb logcat | grep -E "ReactNativeJS|ExpoGo|GPS"
```

### 3. iOS — Console.app / Simulator
Untuk simulator iOS:
```bash
xcrun simctl spawn booted log stream --predicate 'process == "Expo Go"'
```

### 4. Remote JS Debugger
Di Expo Go, shake perangkat → **Debug Remote JS**. Semua log akan muncul di browser Chrome DevTools.

### 5. Global Error Handler
`App.tsx` sudah memasang `ErrorUtils.setGlobalHandler` yang menangkap semua *unhandled error* (termasuk promise rejection) dan meneruskannya ke `console.error`. Ini memastikan error tidak hilang begitu saja di Expo Go.

### Tips GPS
- Pastikan GPS di perangkat **aktif** (bukan hanya izin diberikan).
- Jika muncul pesan error izin lokasi, tap tombol **"Buka Pengaturan Izin"** di kartu GPS untuk langsung membuka halaman izin sistem.
- Emulator akan selalu terdeteksi sebagai `isMockGps = true` — gunakan perangkat fisik untuk testing absensi.

