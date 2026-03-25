// src/api/services.ts
// API service functions untuk semua endpoint absensi
import apiClient from './client';

// ─── Auth ────────────────────────────────────────────────────
export const authService = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  changePassword: async (oldPassword: string, newPassword: string) => {
    const res = await apiClient.put('/auth/change-password', { oldPassword, newPassword });
    return res.data;
  },
};

// ─── Attendance ──────────────────────────────────────────────
export const attendanceService = {
  getConfig: async () => {
    const res = await apiClient.get('/attendance/config');
    return res.data;
  },
  getMyStatus: async () => {
    const res = await apiClient.get('/attendance/my-status');
    return res.data;
  },
  clockIn: async (data: {
    latitude: number;
    longitude: number;
    isMockGps?: boolean;
    faceConfidence?: number;
    selfieUrl?: string;
  }) => {
    const res = await apiClient.post('/attendance/clock-in', data);
    return res.data;
  },
  clockOut: async (data: {
    latitude: number;
    longitude: number;
    isMockGps?: boolean;
    selfieUrl?: string;
  }) => {
    const res = await apiClient.post('/attendance/clock-out', data);
    return res.data;
  },
  getMyLogs: async (month: number, year: number) => {
    const res = await apiClient.get(`/attendance/my-logs?month=${month}&year=${year}`);
    return res.data;
  },
};

// ─── Leave ───────────────────────────────────────────────────
export const leaveService = {
  create: async (data: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachment?: string;
  }) => {
    const res = await apiClient.post('/leaves', data);
    return res.data;
  },
  getMyRequests: async (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await apiClient.get(`/leaves/my-requests${query}`);
    return res.data;
  },
};

// ─── Holiday ─────────────────────────────────────────────────
export const holidayService = {
  checkDate: async (date: string) => {
    const res = await apiClient.get(`/holidays/check/${date}`);
    return res.data;
  },
  getAll: async (year: string) => {
    const res = await apiClient.get(`/holidays?year=${year}`);
    return res.data;
  },
};

// ─── CMS Settings ──────────────────────────────────────────────
export const cmsService = {
  getSettings: async () => {
    // CMS public settings (does not require authentication token)
    // Returns the settings object directly: { site_logo: "url", site_name: "...", ... }
    const res = await apiClient.get('/cms/settings');
    return res.data.data;
  },
};
