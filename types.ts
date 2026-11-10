
export enum ParticleShape {
  QUANTUM_ATOM = 'QUANTUM_ATOM',
  GALAXY = 'GALAXY',
  SOLAR_SYSTEM = 'SOLAR_SYSTEM',
  BLACK_HOLE = 'BLACK_HOLE',
  NEBULA = 'NEBULA',
  SUPERNOVA = 'SUPERNOVA',
  FIREWORKS = 'FIREWORKS',
  HEART = 'HEART',
  DNA = 'DNA',
  TORUS_KNOT = 'TORUS_KNOT',
  CHAOS_BUTTERFLY = 'CHAOS_BUTTERFLY',
  FACE_MASK = 'FACE_MASK',
  FLOWER_OF_LIFE = 'FLOWER_OF_LIFE',
  FRACTAL_CUBE = 'FRACTAL_CUBE',
  VORTEX = 'VORTEX',
  LOTUS = 'LOTUS',
  PYRAMID = 'PYRAMID',
  PHARAOH = 'PHARAOH',
  DRAGON = 'DRAGON',
  PHOENIX = 'PHOENIX',
  ATOMUS_PRIME = 'ATOMUS_PRIME',
  ATOMUS_FLOW = 'ATOMUS_FLOW',
  ATOMUS_GRAVITY = 'ATOMUS_GRAVITY',
  NEFERTITI = 'NEFERTITI',
  ANUBIS = 'ANUBIS',
  HORUS = 'HORUS',
  SCARAB = 'SCARAB'
}

export interface AppSettings {
  particleCount: number;
  particleSize: number;
  particleLength: number;
  musicEnabled: boolean;
  themeColor: string;
  gestureSensitivity: number; // 0.1 to 2.0
  speed: number; // 0.1 to 5.0 (multiplier)
  zoom: number; // -4.0 to 4.0 (mapped logic)
  rotationX: number; // 0 to 360
  rotationY: number; // 0 to 180
  autoRotate: boolean;
  isTourActive?: boolean;
}

export interface HandData {
  present: boolean;
  x: number;
  y: number;
  z: number;
  pinchDistance: number;
  fingerCount: number;
  gesture: 'PINCH' | 'OPEN' | 'FIST' | 'NONE';
  velocity: number;
  landmarks?: any[];
}

export interface FaceData {
  present: boolean;
  x: number;
  y: number;
  mouthOpen: number;
  landmarks: any[];
}

export interface HolisticData {
  hands: HandData[];
  face: FaceData;
  isExploding: boolean;
  explosionPower: number;
  explosionCenter: { x: number, y: number, z: number };
}

export interface CosmicMantra {
  insight: string;
  colorTheme: string;
}
