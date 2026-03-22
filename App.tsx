import 'react-native-gesture-handler';
// App.tsx — Entry point with TF.js initialization
import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, ActivityIndicator, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { storage } from './src/utils/storage';
import { initTF } from './src/utils/faceEngine';

// Aktifkan LogBox agar semua error/warning tampil di Expo Go UI
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Tangkap semua unhandled error dan log ke console (agar muncul di terminal Metro)
// (global as any) diperlukan karena ErrorUtils adalah API internal React Native
const errorUtils = (global as any).ErrorUtils;
if (errorUtils) {
  const originalHandler = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler?.((error: Error, isFatal: boolean) => {
    console.error('[GlobalError]', isFatal ? '[FATAL]' : '[NON-FATAL]', error.message, error.stack);
    if (originalHandler) originalHandler(error, isFatal);
  });
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      // Check auth
      const token = await storage.getToken();
      setIsLoggedIn(!!token);
      setChecking(false);

      // Initialize TensorFlow.js in background (non-blocking)
      initTF().then((ready) => {
        console.log('[App] TF.js ready:', ready);
      });
    })();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F3D24' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 }}>Memuat...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#0F3D24" />
        {isLoggedIn ? (
          <AppNavigator onLogout={() => setIsLoggedIn(false)} />
        ) : (
          <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
