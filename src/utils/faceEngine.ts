// src/utils/faceEngine.ts
// TensorFlow.js Dummy Engine for Expo Go
// Since @tensorflow/tfjs-react-native has native modules that crash
// Expo Go (java.lang.NoSuchMethodError), we revert to Phase 1 (selfie capture only)
// for the Expo Go environment.

import { storage } from './storage';

let tfReady = false;

/**
 * Initialize TensorFlow.js (Dummy)
 * Always returns false in Expo Go managed workflow to trigger Phase 1 fallback
 */
export async function initTF(): Promise<boolean> {
  console.log('[FaceEngine] Running in Expo Go mode - TF.js disabled. Using Phase 1 selfie fallback.');
  tfReady = false;
  return false;
}

/**
 * Check if TF engine is ready
 */
export function isReady(): boolean {
  return tfReady;
}

/**
 * Detect faces in an image URI (Dummy)
 */
export async function detectFaces(imageUri: string): Promise<any[]> {
  return [];
}

/**
 * Extract a face embedding (Dummy)
 */
export async function extractEmbedding(imageUri: string): Promise<number[] | null> {
  return null;
}

/**
 * Compare two embeddings (Dummy)
 */
export function compareFaces(emb1: number[], emb2: number[]): number {
  return 0;
}

/**
 * Register a face (Dummy)
 */
export async function registerFace(imageUri: string): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'Fitur registrasi wajah (AI) tidak didukung di simulator/Expo Go. Gunakan real device build.' };
}

/**
 * Verify a face against stored embedding (Dummy)
 */
export async function verifyFace(imageUri: string): Promise<{
  verified: boolean;
  confidence: number;
  message: string;
  faceDetected: boolean;
}> {
  return {
    verified: false,
    confidence: 0,
    message: 'Wajah diproses dalam mode Selfie (Phase 1).',
    faceDetected: false,
  };
}
