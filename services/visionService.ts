// This service manages the connection to MediaPipe's vision tasks.
// It is designed to run locally in the browser using CDN assets.

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;
let webcamRunning: boolean = false;

// Initialize the model
export const initializeHandLandmarker = async (): Promise<boolean> => {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    return true;
  } catch (error) {
    console.warn("Failed to load MediaPipe:", error);
    return false;
  }
};

export const detectHands = (video: HTMLVideoElement) => {
  if (!handLandmarker) return null;
  const startTimeMs = performance.now();
  const results = handLandmarker.detectForVideo(video, startTimeMs);
  return results;
};

export const isWebcamSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};