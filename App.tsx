
import React, { useState, useEffect, useCallback } from 'react';
import { ParticleCanvas } from './components/ParticleCanvas';
import { HandTracker } from './components/HandTracker';
import { HolisticData, ParticleShape, CosmicMantra, AppSettings } from './types';
import { SHAPE_LABELS } from './constants';
import { getAuraInsight } from './services/geminiService';
import { SmartNavBar } from './components/SmartNavBar';

import { Scan, Waves, Orbit, Play, MousePointer2, Palette, Camera, Sliders } from 'lucide-react';

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visionData, setVisionData] = useState<HolisticData>({
    hands: [],
    face: { present: false, x: 0, y: 0, mouthOpen: 0, landmarks: [] },
    isExploding: false,
    explosionPower: 0,
    explosionCenter: { x: 0, y: 0, z: 0 }
  });

  const [currentShape, setCurrentShape] = useState<ParticleShape>(ParticleShape.QUANTUM_ATOM);
  const [settings, setSettings] = useState<AppSettings>({
    particleCount: 35000,
    particleSize: 0.15,
    particleLength: 6,
    musicEnabled: true,
    themeColor: "#00f2ff",
    gestureSensitivity: 1.0,
    speed: 1.0,
    zoom: 0, // Default 0 corresponds to 1.0x factor
    rotationX: 0,
    rotationY: 45,
    autoRotate: true,
    isTourActive: false
  });

  const [mantra, setMantra] = useState<CosmicMantra>({
    insight: "Align your spirit with the geometry of creation...",
    colorTheme: settings.themeColor
  });

  // تتبع الماوس
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // تحديث البصيرة الكونية عند تغيير الشكل
  useEffect(() => {
    if (!isStarted) return;
    let isMounted = true;
    const fetchAuraData = async () => {
      try {
        const insight = await getAuraInsight(SHAPE_LABELS[currentShape]);
        if (isMounted) setMantra(prev => ({ ...prev, insight }));
      } catch (err) {
        console.error("Insight error", err);
      }
    };
    fetchAuraData();
    return () => { isMounted = false; };
  }, [currentShape, isStarted]);

  const [isUiVisible, setIsUiVisible] = useState(true);
  const idleTimer = React.useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = React.useRef(0);
  const lastHandPos = React.useRef<{ x: number, time: number } | null>(null);
  const lastShapeChange = React.useRef(0);

  const resetIdleTimer = useCallback(() => {
    setIsUiVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setIsUiVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current) {
        setIsUiVisible(false);
      } else {
        setIsUiVisible(true);
      }
      lastScrollY.current = currentScrollY;
      resetIdleTimer();
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    resetIdleTimer();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  // Virtual Tour Auto-Switcher Logic
  useEffect(() => {
    if (!settings.isTourActive) return;

    // Initial setup for tour
    setSettings(prev => ({ ...prev, autoRotate: false })); // Disable standard auto-rotate for custom cinematic orbit

    const interval = setInterval(() => {
      // Randomize parameters for variety
      const randomSpeed = 0.8 + Math.random() * 1.2;
      // Occasional zoom in/out
      const randomZoom = Math.random() > 0.6 ? (Math.random() * 20 - 10) : 0;

      setSettings(prev => ({
        ...prev,
        speed: randomSpeed,
        zoom: randomZoom
      }));

      const shapes = Object.values(ParticleShape);
      const nextShape = shapes[(shapes.indexOf(currentShape) + 1) % shapes.length];
      setCurrentShape(nextShape);
    }, 8000); // Switch every 8 seconds

    return () => clearInterval(interval);
  }, [settings.isTourActive, currentShape]);

  // منطق تغيير الأشكال بناءً على اليد (Swipe Gestures & Fingers)
  useEffect(() => {
    const hands = visionData.hands;
    const now = Date.now();

    // Swipe Detection for Shape Switching
    if (hands.length > 0 && now - lastShapeChange.current > 1000) {
      const hand = hands[0];

      if (lastHandPos.current) {
        const dx = hand.x - lastHandPos.current.x;
        const dt = now - lastHandPos.current.time;

        // Swipe Thresholds
        if (Math.abs(dx) > 0.3 && dt < 300) {
          const shapes = Object.values(ParticleShape);
          const currentIndex = shapes.indexOf(currentShape);
          let nextIndex = currentIndex;

          if (dx > 0) {
            // Swipe Right -> Previous
            nextIndex = (currentIndex - 1 + shapes.length) % shapes.length;
          } else {
            // Swipe Left -> Next
            nextIndex = (currentIndex + 1) % shapes.length;
          }

          setCurrentShape(shapes[nextIndex]);
          lastShapeChange.current = now;
          lastHandPos.current = null; // Reset
        }
      }

      // Update tracking
      if (!lastHandPos.current || now - lastHandPos.current.time > 300) {
        lastHandPos.current = { x: hand.x, time: now };
      }
    }

    // Finger Counting Logic (Secondary fallback)
    if (now - lastShapeChange.current > 2000) { // Slower check
      if (hands.length === 2) {
        if (currentShape !== ParticleShape.VORTEX) setCurrentShape(ParticleShape.VORTEX);
      } else if (hands.length === 1) {
        const h = hands[0];
        // Only change if explicitly holding a pose for a while could be annoying.
        // Let's keep specific poses for specific "Hot Key" shapes
        if (h.fingerCount === 5 && h.gesture === 'OPEN' && currentShape !== ParticleShape.LOTUS) {
          // Optional: Only if not moving fast
        }
      }
    }

    // Pinch for Settings
    if (hands.length > 0 && hands[0].gesture === 'PINCH') {
      // Adjust Expansion based on vertical position
      const expansion = Math.max(1, Math.min(15, Math.floor((1 - hands[0].y) * 15)));
      if (Math.abs(expansion - settings.particleLength) > 1) {
        setSettings(prev => ({ ...prev, particleLength: expansion }));
      }
    }

  }, [visionData.hands, currentShape, settings.particleLength]);


  const warpActive = visionData.hands.some(h => h.velocity > 0.04);

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-white p-10 text-center relative z-50">
        <div className="mb-8 p-12 rounded-[3rem] border border-cyan-500/20 hud-glass max-w-2xl relative overflow-hidden group">
          <div className="absolute inset-0 loader-shimmer opacity-30 pointer-events-none" />
          <Orbit className="w-20 h-20 text-cyan-400 mx-auto mb-6 animate-pulse group-hover:scale-125 transition-transform" />
          <h1 className="text-5xl font-black italic tracking-tighter mb-4 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            QUNDMIND AURA
          </h1>
          <p className="text-white/60 text-lg mb-10 leading-relaxed font-light italic">
            Experience the fusion of neural tracking and tactile interaction. Touch the cosmos.
          </p>
          <button
            onClick={() => {
              console.log("Launch button clicked");
              setIsStarted(true);
            }}
            className="relative z-50 flex items-center gap-4 bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-cyan-400 hover:scale-110 transition-all group shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            Launch Experience
          </button>
        </div>
        <p className="text-white/20 text-xs uppercase tracking-[0.5em] animate-bounce">Scroll or Touch to Interact</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#000] overflow-hidden select-none text-white font-sans cursor-none box-border">


      {/* Custom Cursor */}
      <div
        className="fixed w-8 h-8 rounded-full border border-white/50 pointer-events-none z-[100] transition-transform duration-75 mix-blend-difference"
        style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, -50%)' }}
      >
        <div className="absolute inset-2 bg-white/30 rounded-full animate-ping" />
      </div>

      <ParticleCanvas data={visionData} shape={currentShape} settings={settings} />

      <SmartNavBar currentShape={currentShape} onShapeChange={setCurrentShape} />

      <div className="absolute top-10 left-10 z-20 flex flex-col gap-6">
        <HandTracker onUpdate={setVisionData} enabled={isStarted} />

        <div className="hud-glass p-7 rounded-[2.5rem] w-80 shadow-2xl backdrop-blur-xl border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${visionData.hands.length > 0 ? 'bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]' : 'bg-white/20'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 italic">Neural Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <MousePointer2 className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 italic">Tactile Mode</span>
            </div>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            {SHAPE_LABELS[currentShape]}
          </h1>
        </div>
      </div>

      {/* Control Panel */}
      <div className="absolute top-10 right-10 z-30 w-80 hud-glass p-6 rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 italic">Optimization</h2>
          <button
            onClick={() => setSettings(p => ({ ...p, isTourActive: !p.isTourActive }))}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.isTourActive ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          >
            <Orbit className={`w-3 h-3 ${settings.isTourActive ? 'animate-spin' : ''}`} />
            {settings.isTourActive ? 'Tour Active' : 'Start Tour'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Density</label>
              <span className="text-xs font-mono text-amber-400">{settings.particleCount}</span>
            </div>
            <input
              type="range" min="5000" max="80000" step="5000"
              value={settings.particleCount}
              onChange={(e) => setSettings({ ...settings, particleCount: parseInt(e.target.value) })}
              className="w-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Expansion</label>
              <span className="text-xs font-mono text-amber-400">{settings.particleLength}</span>
            </div>
            <input
              type="range" min="1" max="15" step="1"
              value={settings.particleLength}
              onChange={(e) => setSettings({ ...settings, particleLength: parseInt(e.target.value) })}
              className="w-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Speed Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Speed</label>
              <span className="text-xs font-mono text-amber-400">{settings.speed?.toFixed(1) || '1.0'}x</span>
            </div>
            <input
              type="range" min="0.1" max="5.0" step="0.1"
              value={settings.speed || 1.0}
              onChange={(e) => setSettings({ ...settings, speed: parseFloat(e.target.value) })}
              className="w-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity accent-amber-400"
            />
          </div>

          {/* Extreme Zoom Control (-50 to 50) */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Zoom (50x)</label>
              <span className="text-xs font-mono text-amber-400">{settings.zoom?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/30">-50x</span>
              <input
                type="range" min="-50" max="50" step="1"
                value={settings.zoom || 0}
                onChange={(e) => setSettings({ ...settings, zoom: parseFloat(e.target.value) })}
                className="w-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity accent-cyan-400"
              />
              <span className="text-[9px] text-white/30">+50x</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Camera Angle</h3>
              <button
                onClick={() => setSettings({ ...settings, autoRotate: !settings.autoRotate })}
                className={`px-3 py-1 rounded text-[9px] font-bold uppercase border transition-all ${settings.autoRotate ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-white/5 text-white/30 border-white/10'}`}
              >
                Auto Rotate: {settings.autoRotate ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Rotation Controls (Only active if Auto-Rotate is OFF or user wants to override) */}
            <div className={`space-y-3 transition-opacity duration-300 ${!settings.autoRotate && !settings.isTourActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[9px] text-white/50 uppercase">Rotate X</label>
                  <span className="text-[9px] font-mono text-cyan-400">{Math.round(settings.rotationX || 0)}°</span>
                </div>
                <input
                  type="range" min="0" max="360" step="1"
                  value={settings.rotationX || 0}
                  onChange={(e) => setSettings({ ...settings, rotationX: parseInt(e.target.value), autoRotate: false })}
                  className="w-full h-1 cursor-pointer accent-white"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[9px] text-white/50 uppercase">Rotate Y</label>
                  <span className="text-[9px] font-mono text-cyan-400">{Math.round(settings.rotationY || 45)}°</span>
                </div>
                <input
                  type="range" min="10" max="170" step="1"
                  value={settings.rotationY || 45}
                  onChange={(e) => setSettings({ ...settings, rotationY: parseInt(e.target.value), autoRotate: false })}
                  className="w-full h-1 cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Sensitivity</label>
              <span className="text-xs font-mono text-amber-400">{settings.gestureSensitivity.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.1" max="2.0" step="0.1"
              value={settings.gestureSensitivity}
              onChange={(e) => setSettings({ ...settings, gestureSensitivity: parseFloat(e.target.value) })}
              className="w-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2"><Palette className="w-3 h-3" /> Aura Hue</h3>
              <div className="flex justify-between">
                {['#00f2ff', '#fbbf24', '#ff0055', '#7000ff', '#00ffaa'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSettings({ ...settings, themeColor: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 ${settings.themeColor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  const link = document.createElement('a');
                  link.download = `aura-snapshot-${Date.now()}.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
                }
              }}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group"
            >
              <Camera className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Snapshot</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`absolute bottom-40 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-8 transition-opacity duration-500 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="hud-glass p-8 rounded-[2.5rem] border border-white/5 relative group overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all hover:border-white/10">
          <div className="flex items-center gap-6 relative z-10">
            <Orbit className={`w-10 h-10 text-cyan-400 ${warpActive ? 'animate-spin' : 'animate-pulse'}`} />
            <p className="text-xl font-light italic text-white/80 leading-snug tracking-tight">
              "{mantra.insight}"
            </p>
          </div>
        </div>
      </div>

      <div className="absolute right-10 bottom-10 z-20 flex gap-4">
        <div className={`hud-glass p-3 rounded-xl flex items-center gap-3 border transition-all ${visionData.face.present ? 'border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'border-white/10 text-white/20'}`}>
          <Scan className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Face Mesh</span>
        </div>
        <div className={`hud-glass p-3 rounded-xl flex items-center gap-3 border transition-all ${visionData.hands.length > 0 ? 'border-amber-400 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'border-white/10 text-white/20'}`}>
          <Waves className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Neural Link</span>
        </div>
      </div>
    </div>
  );
};

export default App;
