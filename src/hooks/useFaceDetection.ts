// src/hooks/useFaceDetection.ts
// Hook Face Detection — Phase 2: TensorFlow.js BlazeFace integration
// Captures selfie, detects face, extracts embedding, verifies against stored face
import { useState, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { verifyFace, isReady, registerFace } from '../utils/faceEngine';
import { storage } from '../utils/storage';

export interface FaceResult {
  selfieUri: string;
  confidence: number;
  verified: boolean;
  faceDetected: boolean;
  message: string;
}

export function useFaceDetection() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<FaceResult | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const hasPermission = permission?.granted ?? false;

  const requestCameraPermission = useCallback(async () => {
    const { granted } = await requestPermission();
    return granted;
  }, [requestPermission]);

  /**
   * Capture selfie & verify face against registered embedding
   */
  const captureSelfie = useCallback(async (): Promise<FaceResult | null> => {
    if (!cameraRef.current) return null;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) {
        setCapturing(false);
        return null;
      }

      // Check if face is registered
      const storedEmbedding = await storage.getFaceEmbedding();

      let faceResult: FaceResult;

      if (!storedEmbedding || !isReady()) {
        // No registered face OR TF not ready → fallback to Phase 1 (capture only)
        faceResult = {
          selfieUri: photo.uri,
          confidence: 1.0,
          verified: true,
          faceDetected: true,
          message: storedEmbedding ? 'TF.js belum siap, selfie diambil sebagai bukti' : 'Wajah belum didaftarkan, selfie diambil sebagai bukti',
        };
      } else {
        // TF.js is ready & face is registered → full verification
        const verification = await verifyFace(photo.uri);
        faceResult = {
          selfieUri: photo.uri,
          confidence: verification.confidence,
          verified: verification.verified,
          faceDetected: verification.faceDetected,
          message: verification.message,
        };
      }

      setResult(faceResult);
      setCapturing(false);
      return faceResult;
    } catch (err) {
      console.error('Face capture error:', err);
      // Fallback: capture-only mode on error
      setCapturing(false);
      return null;
    }
  }, []);

  /**
   * Register face from a captured photo
   */
  const registerFromCamera = useCallback(async (): Promise<FaceResult | null> => {
    if (!cameraRef.current) return null;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) {
        setCapturing(false);
        return null;
      }

      if (!isReady()) {
        setCapturing(false);
        return {
          selfieUri: photo.uri,
          confidence: 0,
          verified: false,
          faceDetected: false,
          message: 'TensorFlow.js belum siap. Coba lagi.',
        };
      }

      const regResult = await registerFace(photo.uri);

      const faceResult: FaceResult = {
        selfieUri: photo.uri,
        confidence: regResult.success ? 1.0 : 0,
        verified: regResult.success,
        faceDetected: regResult.success,
        message: regResult.message,
      };

      setResult(faceResult);
      setCapturing(false);
      return faceResult;
    } catch (err) {
      console.error('Face register error:', err);
      setCapturing(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    cameraRef,
    hasPermission,
    requestCameraPermission,
    captureSelfie,
    registerFromCamera,
    capturing,
    result,
    reset,
  };
}
