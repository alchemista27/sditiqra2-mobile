// src/screens/LeaveScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { leaveService } from '../api/services';

const leaveTypes = [
  { value: 'IZIN', label: 'Izin', icon: 'assignment' as any },
  { value: 'SAKIT', label: 'Sakit', icon: 'local-hospital' as any },
  { value: 'CUTI', label: 'Cuti', icon: 'beach-access' as any },
  { value: 'DINAS', label: 'Dinas', icon: 'directions-car' as any },
];

const statusInfo: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', label: 'Menunggu', icon: 'hourglass-empty' },
  APPROVED: { bg: '#D1FAE5', color: '#065F46', label: 'Disetujui', icon: 'check-circle' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', label: 'Ditolak', icon: 'cancel' },
};


export default function LeaveScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: 'IZIN', startDate: '', endDate: '', reason: '' });

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await leaveService.getMyRequests();
      setRequests(res.data.requests || []);
    } catch (err: any) { console.log(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      Alert.alert('Lengkapi Form', 'Tanggal dan alasan wajib diisi'); return;
    }
    setSubmitting(true);
    try {
      await leaveService.create(form);
      Alert.alert('Berhasil', 'Pengajuan izin berhasil dikirim.');
      setShowForm(false);
      setForm({ type: 'IZIN', startDate: '', endDate: '', reason: '' });
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || err.message);
    } finally { setSubmitting(false); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <ScrollView style={s.container}>
      <View style={s.header}><Text style={s.title}>Pengajuan Izin</Text></View>

      <TouchableOpacity style={s.newBtn} onPress={() => setShowForm(true)}>
        <Text style={s.newBtnTxt}>+ Buat Pengajuan Baru</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color="#1B6B44" style={{ marginTop: 40 }} size="large" /> :
      requests.length === 0 ? (
        <View style={s.empty}>
          <MaterialIcons name="assignment" size={48} color="#9CA3AF" />
          <Text style={s.emptyTxt}>Belum ada pengajuan</Text>
        </View>
      ) : (
        <View style={s.list}>
          {requests.map(req => {
            const sc = statusInfo[req.status] || statusInfo.PENDING;
            const lt = leaveTypes.find(o => o.value === req.type);
            return (
              <View key={req.id} style={s.card}>
                <View style={s.cardHead}>
                  <Text style={s.cardType}><MaterialIcons name={lt?.icon || 'assignment'} size={15} /> {lt?.label || req.type}</Text>
                  <View style={[s.badge, { backgroundColor: sc.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <MaterialIcons name={sc.icon as any} size={11} color={sc.color} />
                    <Text style={[s.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
                  </View>
                </View>
                <Text style={s.cardDate}><MaterialIcons name="event" size={13} color="#6B7280" /> {fmtDate(req.startDate)} — {fmtDate(req.endDate)}</Text>
                <Text style={s.cardReason}>{req.reason}</Text>
                {req.approverNote && (
                  <View style={s.noteBox}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400E' }}>Catatan Admin:</Text>
                    <Text style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>{req.approverNote}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Pengajuan Izin Baru</Text>
            <Text style={s.label}>Tipe Izin</Text>
            <View style={s.typeRow}>
              {leaveTypes.map(opt => (
                <TouchableOpacity key={opt.value} onPress={() => setForm({ ...form, type: opt.value })}
                  style={[s.typeBtn, form.type === opt.value && s.typeBtnOn]}>
                  <MaterialIcons name={opt.icon} size={24} color={form.type === opt.value ? '#fff' : '#6B7280'} />
                  <Text style={[s.typeTxt, form.type === opt.value && { color: '#fff' }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Mulai (YYYY-MM-DD)</Text>
                <TextInput style={s.input} value={form.startDate} onChangeText={t => setForm({ ...form, startDate: t })} placeholder="2026-03-10" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Selesai (YYYY-MM-DD)</Text>
                <TextInput style={s.input} value={form.endDate} onChangeText={t => setForm({ ...form, endDate: t })} placeholder="2026-03-11" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
            <Text style={s.label}>Alasan</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={form.reason} onChangeText={t => setForm({ ...form, reason: t })} placeholder="Jelaskan alasan..." placeholderTextColor="#9CA3AF" multiline />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Kirim</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#0F3D24', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  newBtn: { backgroundColor: '#1B6B44', marginHorizontal: 16, marginTop: 12, borderRadius: 14, paddingVertical: 14, alignItems: 'center', elevation: 6 },
  newBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  list: { paddingHorizontal: 16, marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardType: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  cardReason: { fontSize: 13, color: '#374151' },
  noteBox: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTxt: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  typeBtnOn: { backgroundColor: '#1B6B44', borderColor: '#1B6B44' },
  typeTxt: { fontSize: 11, fontWeight: '600', color: '#374151' },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  submitBtn: { flex: 1, backgroundColor: '#1B6B44', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
