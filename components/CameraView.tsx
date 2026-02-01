import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, Loader2 } from 'lucide-react';
import { initializeHandLandmarker, detectHands } from '../services/visionService';
import { PoseData } from '../types';

interface CameraViewProps {
  enabled: boolean;
  onPoseDetected?: (data: PoseData) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ enabled, onPoseDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [detectedPoint, setDetectedPoint] = useState<{x: number, y: number} | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (enabled && !stream) {
      startCamera();
    } else if (!enabled && stream) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const startCamera = async () => {
    setLoading(true);
    setPermissionDenied(false);

    try {
      await initializeHandLandmarker();
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          facingMode: "user"
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    setDetectedPoint(null);
  };

  const predictWebcam = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const results = detectHands(videoRef.current);
      if (results && results.landmarks && results.landmarks.length > 0) {
        const tip = results.landmarks[0][8];
        setDetectedPoint({ x: tip.x, y: tip.y });
        if (onPoseDetected) {
            onPoseDetected({
                indexTip: { x: tip.x, y: tip.y, z: tip.z }
            });
        }
      } else {
        setDetectedPoint(null);
      }
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  if (!enabled) return null;

  return (
    <div className="absolute top-4 right-4 z-40">
      <div className="relative w-32 h-24 bg-slate-950 rounded border border-slate-800 shadow-xl overflow-hidden group">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-50">
            <Loader2 className="animate-spin text-teal-600 w-5 h-5" />
          </div>
        )}
        
        {permissionDenied ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-2 text-center">
            <CameraOff size={16} />
            <span className="text-[9px] mt-1 font-medium tracking-wide">NO ACCESS</span>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100 opacity-20 group-hover:opacity-40 transition-opacity grayscale" 
            />

            {/* Medical Imaging Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Crosshair Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-teal-500/20"></div>
                
                {/* Ticks */}
                <div className="absolute top-2 left-1/2 w-[1px] h-1 bg-teal-500/30"></div>
                <div className="absolute bottom-2 left-1/2 w-[1px] h-1 bg-teal-500/30"></div>
                <div className="absolute left-2 top-1/2 w-1 h-[1px] bg-teal-500/30"></div>
                <div className="absolute right-2 top-1/2 w-1 h-[1px] bg-teal-500/30"></div>

                {/* Tracking Point */}
                {detectedPoint && (
                    <div 
                        className="absolute w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.8)] transition-all duration-75"
                        style={{
                            left: `${(1 - detectedPoint.x) * 100}%`,
                            top: `${detectedPoint.y * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="absolute inset-0 animate-ping bg-teal-400 rounded-full opacity-50"></div>
                    </div>
                )}
            </div>

            {/* Status Text */}
            <div className="absolute bottom-1 right-1 flex items-center gap-1">
                 <span className={`text-[7px] font-mono tracking-widest ${detectedPoint ? 'text-teal-500' : 'text-slate-600'}`}>
                    {detectedPoint ? 'LOCKED' : 'SEARCHING'}
                 </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
