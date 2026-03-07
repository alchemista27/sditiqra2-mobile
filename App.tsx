import 'react-native-gesture-handler';
// App.tsx — Entry point with TF.js initialization
import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { storage } from './src/utils/storage';
import { initTF } from './src/utils/faceEngine';

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
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0F3D24" />
      {isLoggedIn ? (
        <AppNavigator onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
    </NavigationContainer>
  );
}
