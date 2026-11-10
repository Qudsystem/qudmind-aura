import React, { useState, useEffect, useRef } from 'react';
import { ParticleShape } from '../types';
import { SHAPE_LABELS } from '../constants';
import { Orbit, Activity, Box, Zap, Flower, Heart, Database, Sun, Star, Cloud, Move, Triangle, Crown, Flame, Ghost, Atom, Wind, Magnet, User, Dog, Eye, Bug } from 'lucide-react';

interface SmartNavBarProps {
  currentShape: ParticleShape;
  onShapeChange: (shape: ParticleShape) => void;
}

// Map shapes to icons for better visualization
const SHAPE_ICONS: Partial<Record<ParticleShape, React.ReactNode>> = {
  [ParticleShape.GALAXY]: <Orbit className="w-5 h-5" />,
  [ParticleShape.SOLAR_SYSTEM]: <Sun className="w-5 h-5" />,
  [ParticleShape.BLACK_HOLE]: <div className="w-4 h-4 rounded-full bg-black border border-white/50" />,
  [ParticleShape.NEBULA]: <Cloud className="w-5 h-5" />,
  [ParticleShape.SUPERNOVA]: <Star className="w-5 h-5" />,
  [ParticleShape.DNA]: <Activity className="w-5 h-5" />,
  [ParticleShape.FLOWER_OF_LIFE]: <Flower className="w-5 h-5" />,
  [ParticleShape.HEART]: <Heart className="w-5 h-5" />,
  [ParticleShape.FRACTAL_CUBE]: <Box className="w-5 h-5" />,
  [ParticleShape.QUANTUM_ATOM]: <Zap className="w-5 h-5" />,
  [ParticleShape.VORTEX]: <Move className="w-5 h-5" />,
  [ParticleShape.PYRAMID]: <Triangle className="w-5 h-5" />,
  [ParticleShape.PHARAOH]: <Crown className="w-5 h-5" />,
  [ParticleShape.DRAGON]: <Ghost className="w-5 h-5" />,
  [ParticleShape.PHOENIX]: <Flame className="w-5 h-5" />,
  [ParticleShape.ATOMUS_GRAVITY]: <Magnet className="w-5 h-5" />,
  [ParticleShape.NEFERTITI]: <User className="w-5 h-5" />,
  [ParticleShape.ANUBIS]: <Dog className="w-5 h-5" />,
  [ParticleShape.HORUS]: <Eye className="w-5 h-5" />,
  [ParticleShape.SCARAB]: <Bug className="w-5 h-5" />,
};

export const SmartNavBar: React.FC<SmartNavBarProps> = ({ currentShape, onShapeChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGhost, setIsGhost] = useState(true);
  const [scrollDir, setScrollDir] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const autoTransitionTimer = useRef<NodeJS.Timeout | null>(null);

  const shapesList = Object.keys(SHAPE_LABELS) as ParticleShape[];

  // Auto-transition between shapes smoothly
  useEffect(() => {
    const startAutoTransition = () => {
      if (autoTransitionTimer.current) clearInterval(autoTransitionTimer.current);

      autoTransitionTimer.current = setInterval(() => {
        const currentIndex = shapesList.indexOf(currentShape);
        const nextIndex = (currentIndex + 1) % shapesList.length;
        onShapeChange(shapesList[nextIndex]);
      }, 4000); // Change shape every 4 seconds for smooth continuous transition
    };

    startAutoTransition();

    return () => {
      if (autoTransitionTimer.current) clearInterval(autoTransitionTimer.current);
    };
  }, [currentShape, onShapeChange, shapesList]);

  // Scroll Detection for Ghost State Logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current) {
        setScrollDir('down'); // User scrolling down -> Ghost Mode
        setIsExpanded(false);
        setIsGhost(true);
      } else {
        setScrollDir('up'); // User scrolling up -> Expanded Mode candidate
      }
      lastScrollY.current = currentScrollY;
      resetIdleTimer();
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
    };
  }, []);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (scrollDir === 'up') {
      setIsGhost(false); // Show UI if active
    }

    // Auto-hide after 3 seconds of inactivity
    idleTimer.current = setTimeout(() => {
      setIsGhost(true);
      setIsExpanded(false);
    }, 3000);
  };

  // Interaction Handlers
  const handleMouseEnter = () => {
    setIsGhost(false);
    setIsExpanded(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };

  const handleMouseLeave = () => {
    resetIdleTimer();
  };

  // Micro-interaction: Pulse animation for the active indicator
  const activeIndex = shapesList.indexOf(currentShape);

  return (
    <div
      className="fixed z-50 transition-all duration-500 ease-out-back flex justify-center w-full pointer-events-none"
      style={{
        bottom: isGhost ? '0px' : '24px',
        height: isGhost ? '4px' : '80px',
      }}
    >
      <div
        className={`
          pointer-events-auto relative bg-black/40 backdrop-blur-2xl border border-white/10 
          transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
          ${isGhost ? 'w-full rounded-none border-t-cyan-500/50 border-x-0 border-b-0 hover:h-6 cursor-grab' : 'w-auto max-w-[50vw] min-w-[320px] rounded-full px-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {/* Ghost Handle Visual */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-cyan-400/50 rounded-b-lg transition-opacity duration-300 ${isGhost ? 'opacity-100' : 'opacity-0'}`} />

        {/* Expanded Content */}
        <div className={`flex items-center gap-4 h-full transition-opacity duration-300 ${isGhost ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

          {/* Active Indicator & Shape List */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mask-gradient">
            {shapesList.map((shape) => (
              <button
                key={shape}
                onClick={() => onShapeChange(shape)}
                className={`
                    group relative flex items-center justify-center w-12 h-12 rounded-full 
                    transition-all duration-700 ease-in-out
                    ${currentShape === shape ? 'bg-cyan-500 text-black scale-110 shadow-[0_0_20px_cyan]' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:scale-105'}
                  `}
                style={{
                  transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                {SHAPE_ICONS[shape] || <Orbit className="w-5 h-5" />}

                {/* Tooltip */}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap pointer-events-none">
                  {SHAPE_LABELS[shape]}
                </span>
              </button>
            ))}
          </div>

          <div className="h-8 w-[1px] bg-white/10 mx-2" />

          {/* Current Shape Label */}
          <div className="flex flex-col min-w-[100px]">
            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Active</span>
            <span className="text-sm font-bold text-cyan-400 whitespace-nowrap">{SHAPE_LABELS[currentShape]}</span>
          </div>

        </div>
      </div>
    </div>
  );
};
