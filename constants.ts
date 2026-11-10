
import { ParticleShape } from './types';

export const PARTICLE_COUNT = 45000; 
export const MAX_TRANSITION_SPEED = 0.04;

export const SHAPE_LABELS: Record<ParticleShape, string> = {
  [ParticleShape.GALAXY]: 'Cosmic Spiral',
  [ParticleShape.SOLAR_SYSTEM]: 'Solar Evolution',
  [ParticleShape.BLACK_HOLE]: 'Singularity',
  [ParticleShape.NEBULA]: 'Star Nursery',
  [ParticleShape.SUPERNOVA]: 'Stellar Death',
  [ParticleShape.FIREWORKS]: 'Galactic Joy',
  [ParticleShape.HEART]: 'Vital Core',
  [ParticleShape.DNA]: 'Life Blueprint',
  [ParticleShape.TORUS_KNOT]: 'Infinity Loop',
  [ParticleShape.CHAOS_BUTTERFLY]: 'Chaos Theory',
  [ParticleShape.QUANTUM_ATOM]: 'Subatomic Flow',
  [ParticleShape.FACE_MASK]: 'Neural Mirror',
  [ParticleShape.FLOWER_OF_LIFE]: 'Sacred Geometry',
  [ParticleShape.FRACTAL_CUBE]: 'Hypercube Matrix',
  [ParticleShape.VORTEX]: 'Wormhole Path',
  [ParticleShape.LOTUS]: 'Zen Blossom',
  [ParticleShape.PYRAMID]: 'Giza Eternity',
  [ParticleShape.PHARAOH]: 'Tutankhamun Legacy',
  [ParticleShape.DRAGON]: 'Celestial Dragon',
  [ParticleShape.PHOENIX]: 'Rebirth Fire',
  [ParticleShape.ATOMUS_PRIME]: 'Quantum Swarm',
  [ParticleShape.ATOMUS_FLOW]: 'Aurora Flux',
  [ParticleShape.ATOMUS_GRAVITY]: 'Singularity Field',
  [ParticleShape.NEFERTITI]: 'Queen Nefertiti',
  [ParticleShape.ANUBIS]: 'Guardian Anubis',
  [ParticleShape.HORUS]: 'Eye of Horus',
  [ParticleShape.SCARAB]: 'Golden Scarab'
};
