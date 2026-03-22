// src/api/config.ts
// Konfigurasi API base URL
//
// Backend sudah deploy di Vercel:
// https://sditiqra2-backend.vercel.app

// Mengambil URL dari Environment Variable (.env)
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const API_BASE_URL = API_URL;
