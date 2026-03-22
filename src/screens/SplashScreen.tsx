// src/screens/SplashScreen.tsx
// Custom in-app splash screen with dynamic logo from backend
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Animated, StyleSheet, Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');

interface Props {
  logoUrl: string | null;
  isReady: boolean;
  onFadeComplete: () => void;
}

export default function SplashScreen({ logoUrl, isReady, onFadeComplete }: Props) {
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  const screenFadeAnim = useRef(new Animated.Value(1)).current;

  // Mount: fade-in + scale-in content
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start loading dots animation
    startDotsAnimation();
  }, []);

  // isReady: fade-out entire screen
  useEffect(() => {
    if (isReady) {
      // Small delay to ensure logo has rendered if available
      const timer = setTimeout(() => {
        Animated.timing(screenFadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => onFadeComplete());
      }, 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]); // onFadeComplete intentionally excluded — stable callback from parent

  // Loading dots: staggered pulse animation
  const startDotsAnimation = () => {
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    Animated.parallel([
      createPulse(dot1Anim, 0),
      createPulse(dot2Anim, 200),
      createPulse(dot3Anim, 400),
    ]).start();
  };

  return (
    <Animated.View style={[styles.container, { opacity: screenFadeAnim }]}>
      {/* Simulated gradient background */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoOuter}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.logoFallback}>I2</Text>
            )}
          </View>
        </View>

        {/* School name */}
        <Text style={styles.schoolName}>SDIT Iqra 2</Text>
        <Text style={styles.city}>Kota Bengkulu</Text>

        {/* Divider line */}
        <View style={styles.divider} />

        <Text style={styles.subtitle}>Sistem Absensi Digital</Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F3D24',
  },
  // Simulated gradient: top half darker, bottom half lighter
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#0F3D24',
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#14472C',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoOuter: {
    marginBottom: 24,
    // Subtle glow effect
    shadowColor: '#2D9164',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  logoFallback: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  schoolName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  city: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 1,
    marginVertical: 16,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 100,
    zIndex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '500',
    zIndex: 1,
  },
});
