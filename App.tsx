import 'react-native-gesture-handler';
// App.tsx — Entry point with TF.js initialization and custom splash screen
import React, { useState, useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';
import { storage } from './src/utils/storage';
import { initTF } from './src/utils/faceEngine';
import { cmsService } from './src/api/services';
import { API_BASE_URL } from './src/api/config';

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    (async () => {
      // Parallel: check auth token + fetch CMS logo
      const [token] = await Promise.all([
        storage.getToken(),
        cmsService.getSettings()
          .then((data: Record<string, string>) => {
            const url = data?.site_logo;
            if (url) {
              const fullUrl = url.startsWith('http')
                ? url
                : `${API_BASE_URL.replace('/api', '')}${url}`;
              setLogoUrl(fullUrl);
            }
          })
          .catch(() => {}), // Silent fail — logo is not required
      ]);

      setIsLoggedIn(!!token);
      setChecking(false); // Triggers splash fade-out

      // Initialize TensorFlow.js in background (non-blocking)
      initTF().then((ready) => {
        console.log('[App] TF.js ready:', ready);
      });
    })();
  }, []);

  // Show custom splash screen while checking auth + fetching logo
  if (checking || !splashDone) {
    return (
      <SplashScreen
        logoUrl={logoUrl}
        isReady={!checking}
        onFadeComplete={() => setSplashDone(true)}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#0F3D24" />
        {isLoggedIn ? (
          <AppNavigator onLogout={() => setIsLoggedIn(false)} logoUrl={logoUrl} />
        ) : (
          <LoginScreen onLogin={() => setIsLoggedIn(true)} logoUrl={logoUrl} />
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
