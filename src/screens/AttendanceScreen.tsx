// src/screens/AttendanceScreen.tsx
// Riwayat kehadiran bulanan
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { attendanceService } from '../api/services';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function AttendanceScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, [month, year]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getMyLogs(month, year);
      setLogs(res.data || []);
    } catch (err: any) {
      console.log('Fetch logs error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return '--:--';
    const d = new Date(t);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Stats
  const hadir = logs.filter(l => l.type === 'HADIR').length;
  const terlambat = logs.filter(l => l.type === 'HADIR' && l.isLate).length;
  const izinTotal = logs.filter(l => ['IZIN', 'SAKIT', 'CUTI', 'DINAS'].includes(l.type)).length;

  const typeColors: Record<string, { bg: string; color: string }> = {
    HADIR: { bg: '#D1FAE5', color: '#065F46' },
    IZIN: { bg: '#DBEAFE', color: '#1E40AF' },
    SAKIT: { bg: '#FEF3C7', color: '#92400E' },
    CUTI: { bg: '#EDE9FE', color: '#5B21B6' },
    DINAS: { bg: '#E0F2FE', color: '#0369A1' },
    ALPHA: { bg: '#FEE2E2', color: '#991B1B' },
    LIBUR: { bg: '#F3F4F6', color: '#6B7280' },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Kehadiran</Text>
      </View>

      {/* Month Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {monthNames.map((name, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setMonth(i + 1)}
            style={[styles.monthBtn, month === i + 1 && styles.monthBtnActive]}
          >
            <Text style={[styles.monthText, month === i + 1 && styles.monthTextActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#1B6B44' }]}>
          <Text style={styles.statValue}>{hadir}</Text>
          <Text style={styles.statLabel}>Hadir</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statValue}>{terlambat}</Text>
          <Text style={styles.statLabel}>Terlambat</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={styles.statValue}>{izinTotal}</Text>
          <Text style={styles.statLabel}>Izin/Cuti</Text>
        </View>
      </View>

      {/* Logs */}
      {loading ? (
        <ActivityIndicator color="#1B6B44" style={{ marginTop: 40 }} size="large" />
      ) : logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Belum ada data kehadiran</Text>
          <Text style={styles.emptySub}>{monthNames[month - 1]} {year}</Text>
        </View>
      ) : (
        <View style={styles.logList}>
          {logs.map((log) => {
            const dateObj = new Date(log.date);
            const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const tc = typeColors[log.type] || typeColors.HADIR;

            return (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logDate}>
                  <Text style={styles.logDayNum}>{dayNum}</Text>
                  <Text style={styles.logDayName}>{dayName}</Text>
                </View>
                <View style={styles.logInfo}>
                  <View style={styles.logTimes}>
                    <Text style={styles.logTimeLabel}>Masuk: <Text style={styles.logTimeValue}>{formatTime(log.clockIn)}</Text></Text>
                    <Text style={styles.logTimeLabel}>Pulang: <Text style={styles.logTimeValue}>{formatTime(log.clockOut)}</Text></Text>
                  </View>
                  {log.anomalyFlag && (
                    <Text style={styles.anomalyText}>⚠️ {log.anomalyFlag === 'MOCK_GPS' ? 'Fake GPS' : log.anomalyFlag === 'OUT_OF_RADIUS' ? 'Luar Radius' : log.anomalyFlag}</Text>
                  )}
                </View>
                <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                  <Text style={[styles.typeText, { color: tc.color }]}>
                    {log.isLate ? 'TELAT' : log.type}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#0F3D24', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },

  monthScroll: { marginTop: 12, marginBottom: 4 },
  monthBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  monthBtnActive: { backgroundColor: '#1B6B44', borderColor: '#1B6B44' },
  monthText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  monthTextActive: { color: '#fff' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderWidth: 1, borderColor: '#E5E7EB',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  logList: { paddingHorizontal: 16, marginTop: 12 },
  logItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  logDate: { width: 44, alignItems: 'center', marginRight: 12 },
  logDayNum: { fontSize: 20, fontWeight: '800', color: '#111827' },
  logDayName: { fontSize: 10, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  logInfo: { flex: 1 },
  logTimes: { flexDirection: 'row', gap: 16 },
  logTimeLabel: { fontSize: 12, color: '#6B7280' },
  logTimeValue: { fontWeight: '700', color: '#111827' },
  anomalyText: { fontSize: 11, color: '#DC2626', marginTop: 4, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
