// src/utils/faceEngine.ts
// TensorFlow.js Face Detection & Embedding Engine
// Uses BlazeFace for face detection + pixel-based embedding for verification
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as blazeface from '@tensorflow-models/blazeface';
import * as FileSystem from 'expo-file-system';
import * as jpeg from 'jpeg-js';
import { storage } from './storage';

let model: blazeface.BlazeFaceModel | null = null;
let tfReady = false;

/**
 * Initialize TensorFlow.js and load BlazeFace model
 * Call once at app startup
 */
export async function initTF(): Promise<boolean> {
  if (tfReady) return true;
  try {
    await tf.ready();
    model = await blazeface.load();
    tfReady = true;
    console.log('[FaceEngine] TF.js + BlazeFace ready');
    return true;
  } catch (err) {
    console.error('[FaceEngine] Init failed:', err);
    return false;
  }
}

/**
 * Check if TF engine is ready
 */
export function isReady(): boolean {
  return tfReady && model !== null;
}

/**
 * Decode a JPEG image URI to raw pixel data (Uint8Array)
 */
async function decodeImageToPixels(uri: string): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const rawData = jpeg.decode(buffer, { useTArray: true });
    return { data: rawData.data, width: rawData.width, height: rawData.height };
  } catch (err) {
    console.error('[FaceEngine] Image decode error:', err);
    return null;
  }
}

/**
 * Detect faces in an image URI
 * @returns array of face predictions (bounding boxes + landmarks)
 */
export async function detectFaces(imageUri: string): Promise<blazeface.NormalizedFace[]> {
  if (!model) throw new Error('Model not loaded. Call initTF() first.');

  const imgData = await decodeImageToPixels(imageUri);
  if (!imgData) return [];

  // Create tensor from pixel data
  const imgTensor = tf.tensor3d(imgData.data, [imgData.height, imgData.width, 4], 'int32');
  // Remove alpha channel (RGBA → RGB)
  const rgb = imgTensor.slice([0, 0, 0], [-1, -1, 3]);

  const predictions = await model.estimateFaces(rgb, false);

  // Cleanup tensors
  imgTensor.dispose();
  rgb.dispose();

  return predictions as blazeface.NormalizedFace[];
}

/**
 * Extract a lightweight face embedding from a face crop
 * Uses downsampled pixel averaging as a fingerprint
 * Not as accurate as a neural embedding (FaceNet), but works client-side
 * without heavy model dependencies
 */
export async function extractEmbedding(imageUri: string): Promise<number[] | null> {
  if (!model) throw new Error('Model not loaded');

  const imgData = await decodeImageToPixels(imageUri);
  if (!imgData) return null;

  const imgTensor = tf.tensor3d(imgData.data, [imgData.height, imgData.width, 4], 'int32');
  const rgb = imgTensor.slice([0, 0, 0], [-1, -1, 3]).toFloat();

  // Detect face first
  const predictions = await model.estimateFaces(rgb.toInt(), false);
  if (predictions.length === 0) {
    imgTensor.dispose();
    rgb.dispose();
    return null;
  }

  const face = predictions[0] as blazeface.NormalizedFace;
  const topLeft = face.topLeft as [number, number];
  const bottomRight = face.bottomRight as [number, number];

  // Crop face region
  const y = Math.max(0, Math.floor(topLeft[1]));
  const x = Math.max(0, Math.floor(topLeft[0]));
  const h = Math.min(Math.floor(bottomRight[1] - topLeft[1]), imgData.height - y);
  const w = Math.min(Math.floor(bottomRight[0] - topLeft[0]), imgData.width - x);

  if (h <= 0 || w <= 0) {
    imgTensor.dispose();
    rgb.dispose();
    return null;
  }

  const faceCrop = rgb.slice([y, x, 0], [h, w, 3]);

  // Resize to 32x32 for consistent embedding
  const resized = tf.image.resizeBilinear(faceCrop.expandDims(0) as tf.Tensor4D, [32, 32]);
  const normalized = resized.div(255.0);

  // Flatten to embedding vector (32*32*3 = 3072 values, then average pool to 128)
  const flat = normalized.reshape([32 * 32 * 3]);
  const flatData = await flat.data();

  // Average pool to 128-dim vector for compact storage & comparison
  const embedding: number[] = [];
  const chunkSize = Math.floor(flatData.length / 128);
  for (let i = 0; i < 128; i++) {
    let sum = 0;
    const start = i * chunkSize;
    for (let j = start; j < start + chunkSize; j++) {
      sum += flatData[j];
    }
    embedding.push(sum / chunkSize);
  }

  // Cleanup all tensors
  imgTensor.dispose();
  rgb.dispose();
  faceCrop.dispose();
  resized.dispose();
  normalized.dispose();
  flat.dispose();

  return embedding;
}

/**
 * Compare two embeddings using cosine similarity
 * @returns similarity score 0–1 (higher = more similar)
 */
export function compareFaces(emb1: number[], emb2: number[]): number {
  if (emb1.length !== emb2.length) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < emb1.length; i++) {
    dotProduct += emb1[i] * emb2[i];
    norm1 += emb1[i] * emb1[i];
    norm2 += emb2[i] * emb2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return Math.max(0, dotProduct / denominator);
}

/**
 * Register a face: detect, extract embedding, and store locally
 * @returns success status
 */
export async function registerFace(imageUri: string): Promise<{ success: boolean; message: string }> {
  const faces = await detectFaces(imageUri);
  if (faces.length === 0) {
    return { success: false, message: 'Tidak ada wajah terdeteksi. Coba lagi dengan pencahayaan yang baik.' };
  }
  if (faces.length > 1) {
    return { success: false, message: 'Terdeteksi lebih dari satu wajah. Pastikan hanya wajah Anda yang terlihat.' };
  }

  const embedding = await extractEmbedding(imageUri);
  if (!embedding) {
    return { success: false, message: 'Gagal mengekstrak data wajah. Coba lagi.' };
  }

  await storage.setFaceEmbedding(embedding);
  return { success: true, message: 'Wajah berhasil didaftarkan!' };
}

/**
 * Verify a face against stored embedding
 * @returns verification result with confidence score
 */
export async function verifyFace(imageUri: string): Promise<{
  verified: boolean;
  confidence: number;
  message: string;
  faceDetected: boolean;
}> {
  const storedEmbedding = await storage.getFaceEmbedding();
  if (!storedEmbedding) {
    return { verified: false, confidence: 0, message: 'Wajah belum didaftarkan. Daftarkan wajah terlebih dahulu.', faceDetected: false };
  }

  const faces = await detectFaces(imageUri);
  if (faces.length === 0) {
    return { verified: false, confidence: 0, message: 'Tidak ada wajah terdeteksi. Arahkan wajah ke kamera.', faceDetected: false };
  }

  const currentEmbedding = await extractEmbedding(imageUri);
  if (!currentEmbedding) {
    return { verified: false, confidence: 0, message: 'Gagal memproses wajah.', faceDetected: true };
  }

  const similarity = compareFaces(storedEmbedding, currentEmbedding);

  // Threshold: 0.75 for verification (configurable via server config)
  const threshold = 0.75;
  const verified = similarity >= threshold;

  return {
    verified,
    confidence: Math.round(similarity * 100) / 100,
    message: verified
      ? `Wajah terverifikasi (${Math.round(similarity * 100)}%)`
      : `Wajah tidak cocok (${Math.round(similarity * 100)}%). Confidence minimum: ${threshold * 100}%`,
    faceDetected: true,
  };
}
