
import React, { useEffect, useRef, useState } from 'react';
import { HolisticData, HandData } from '../types';

interface VisionTrackerProps {
  onUpdate: (data: HolisticData) => void;
  enabled: boolean;
}

// MediaPipe objects are loaded via script tags in index.html
declare const Hands: any;
declare const FaceMesh: any;
declare const Camera: any;

export const HandTracker: React.FC<VisionTrackerProps> = ({ onUpdate, enabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastHandsPos = useRef<any[]>([]);
  const [presence, setPresence] = useState({ hands: 0, face: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current || !enabled) return;

    let camera: any = null;
    let hands: any = null;
    let faceMesh: any = null;

    const initializeMediaPipe = async () => {
      try {
        if (typeof Hands === 'undefined' || typeof FaceMesh === 'undefined' || typeof Camera === 'undefined') {
          console.warn("MediaPipe globals not found. Waiting...");
          // Retry logic could be implemented here, but for now we throw to trigger error state
          throw new Error("MediaPipe components (Hands, FaceMesh, or Camera) are not loaded. Please check your internet connection.");
        }

        hands = new Hands({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
        faceMesh = new FaceMesh({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });

        const state: HolisticData = {
          hands: [],
          face: { present: false, x: 0, y: 0, mouthOpen: 0, landmarks: [] },
          isExploding: false,
          explosionPower: 0,
          explosionCenter: { x: 0, y: 0, z: 0 }
        };

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5
        });

        hands.onResults((results: any) => {
          const detectedHands = results.multiHandLandmarks || [];
          setPresence(p => ({ ...p, hands: detectedHands.length }));

          const currentHands: HandData[] = detectedHands.map((lm: any, idx: number) => {
            const dist = Math.sqrt(Math.pow(lm[4].x - lm[8].x, 2) + Math.pow(lm[4].y - lm[8].y, 2));
            let vel = 0;
            if (lastHandsPos.current[idx]) {
              const dx = lm[9].x - lastHandsPos.current[idx].x;
              const dy = lm[9].y - lastHandsPos.current[idx].y;
              vel = Math.sqrt(dx * dx + dy * dy);
            }
            lastHandsPos.current[idx] = { x: lm[9].x, y: lm[9].y };

            return {
              present: true,
              x: (0.5 - lm[9].x) * 10,
              y: (0.5 - lm[9].y) * 10,
              z: lm[9].z,
              pinchDistance: dist,
              fingerCount: lm.filter((_: any, i: number) => [8, 12, 16, 20].includes(i) && lm[i].y < lm[i - 2].y).length,
              gesture: dist < 0.05 ? 'FIST' : 'OPEN',
              velocity: vel,
              landmarks: lm
            };
          });

          state.hands = currentHands;
          onUpdate({ ...state });
        });

        faceMesh.onResults((results: any) => {
          const detectedFaces = results.multiFaceLandmarks || [];
          setPresence(p => ({ ...p, face: !!detectedFaces.length }));

          if (detectedFaces.length > 0) {
            const lm = detectedFaces[0];
            const mouthTop = lm[13];
            const mouthBottom = lm[14];
            const mouthDist = Math.sqrt(Math.pow(mouthTop.x - mouthBottom.x, 2) + Math.pow(mouthTop.y - mouthBottom.y, 2));

            state.face = {
              present: true,
              x: (0.5 - lm[1].x) * 10,
              y: (0.5 - lm[1].y) * 10,
              mouthOpen: mouthDist,
              landmarks: lm
            };
          } else {
            state.face.present = false;
          }
          onUpdate({ ...state });
        });

        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (enabled && videoRef.current) {
              await hands.send({ image: videoRef.current });
              await faceMesh.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        await camera.start();
      } catch (err: any) {
        console.error("Tracker Initialization Error:", err);
        // Only set error state if component is still mounted
        if (enabled) {
          setError(err.message || "Unknown tracker error");
        }
      }
    };

    // Small delay to ensure scripts are loaded
    const timer = setTimeout(initializeMediaPipe, 1000);

    return () => {
      clearTimeout(timer);
      if (camera) camera.stop();
      if (hands) hands.close();
      if (faceMesh) faceMesh.close();
    };
  }, [enabled]);

  if (error) {
    return (
      <div className="absolute top-0 left-0 w-full bg-red-500/80 text-[10px] p-2 text-center z-50">
        Tracking Error: {error}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10 aspect-video w-64 group shadow-2xl transition-transform hover:scale-105">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] opacity-30 group-hover:opacity-50 transition-opacity" playsInline muted />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 flex gap-2">
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${presence.hands > 0 ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : 'bg-red-500'}`} />
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${presence.face ? 'bg-purple-400 shadow-[0_0_10px_purple]' : 'bg-red-500'}`} />
      </div>
    </div>
  );
};
