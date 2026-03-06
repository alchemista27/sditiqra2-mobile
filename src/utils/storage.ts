// src/utils/storage.ts
// AsyncStorage wrapper untuk auth dan preferences
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  // Auth token
  setToken: async (token: string) => AsyncStorage.setItem('auth_token', token),
  getToken: async () => AsyncStorage.getItem('auth_token'),
  removeToken: async () => AsyncStorage.removeItem('auth_token'),

  // User data (cached)
  setUser: async (user: any) => AsyncStorage.setItem('user_data', JSON.stringify(user)),
  getUser: async () => {
    const data = await AsyncStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  },
  removeUser: async () => AsyncStorage.removeItem('user_data'),

  // Face embedding (client-side)
  setFaceEmbedding: async (embedding: number[]) => AsyncStorage.setItem('face_embedding', JSON.stringify(embedding)),
  getFaceEmbedding: async () => {
    const data = await AsyncStorage.getItem('face_embedding');
    return data ? JSON.parse(data) : null;
  },

  // Logout — clear everything
  clearAll: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  },
};
