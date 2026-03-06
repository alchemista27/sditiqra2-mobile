// src/api/config.ts
// Konfigurasi API base URL
//
// ⚡ PENTING: Sesuaikan URL di bawah ini sebelum testing!
//
// Untuk Expo Go + Tunneling:
//   - Jika backend di lokal:  gunakan IP komputer di WiFi yang sama (bukan localhost)
//   - Jika backend di server: gunakan URL production
//
// Contoh:
//   DEV lokal:   'http://192.168.1.100:5000/api'
//   Production:  'https://sditiqra2-api.up.railway.app/api'

// Ganti URL di bawah ini sesuai setup Anda:
const DEV_API_URL = 'http://192.168.1.100:5000/api';  // ← Ganti dengan IP lokal Anda
const PROD_API_URL = 'https://your-backend.com/api';    // ← Ganti dengan URL production

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
