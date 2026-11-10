
import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, ChromaticAberration } from '@react-three/postprocessing';
import { HolisticData, ParticleShape, AppSettings } from '../types';

interface ParticleCanvasProps {
  data: HolisticData;
  shape: ParticleShape;
  settings: AppSettings;
}

const Particles: React.FC<ParticleCanvasProps> = ({ data, shape, settings }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse, camera } = useThree();
  const count = settings.particleCount;

  const targetPositions = useRef<Float32Array>(new Float32Array(count * 3));
  const velocities = useRef<Float32Array>(new Float32Array(count * 3));
  const interactionPoint = useRef(new THREE.Vector3());

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 800;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 800;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    return pos;
  }, [count]);

  const initialColors = useMemo(() => {
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) cols[i] = 1.0;
    return cols;
  }, [count]);

  const cameraOrbit = useRef({ radius: 100, theta: 0, phi: Math.PI / 4 });
  const warpFactor = useRef(0);

  const generateShape = useCallback((type: ParticleShape) => {
    const newPos = new Float32Array(count * 3);
    const scale = settings.particleLength * 15;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const t = i / count;

      switch (type) {
        case ParticleShape.GALAXY: {
          const arms = 5;
          const armAngle = 0.5; // tightness
          const r = Math.pow(Math.random(), 0.5) * scale * 4; // distribute more towards center
          const spin = angle => angle + (1 / r) * 10; // rotate more near center
          const angle = Math.random() * Math.PI * 2;
          const armOffset = Math.floor(Math.random() * arms) * (Math.PI * 2 / arms);

          const spiralAngle = angle + armOffset + r * armAngle;

          newPos[idx] = Math.cos(spiralAngle) * r;
          newPos[idx + 1] = (Math.random() - 0.5) * (scale / 2) * (1 - r / (scale * 4)); // Flattened disk
          newPos[idx + 2] = Math.sin(spiralAngle) * r;
          break;
        }
        case ParticleShape.SOLAR_SYSTEM: {
          // Sun at center
          if (i < count * 0.05) {
            const r = Math.random() * scale * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            newPos[idx] = r * Math.sin(phi) * Math.cos(theta);
            newPos[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
            newPos[idx + 2] = r * Math.cos(phi);
          } else {
            // Planets/Orbits
            const orbitRadius = scale * (1 + Math.random() * 5);
            const angle = Math.random() * Math.PI * 2;
            newPos[idx] = Math.cos(angle) * orbitRadius;
            newPos[idx + 1] = (Math.random() - 0.5) * scale * 0.1;
            newPos[idx + 2] = Math.sin(angle) * orbitRadius;
          }
          break;
        }
        case ParticleShape.BLACK_HOLE: {
          const r = scale * 2 + Math.random() * scale * 3;
          const angle = Math.random() * Math.PI * 2;
          // Accretion disk
          newPos[idx] = Math.cos(angle) * r;
          newPos[idx + 1] = (Math.random() - 0.5) * (scale * 0.2);
          newPos[idx + 2] = Math.sin(angle) * r;

          // Event horizon void
          if (Math.random() > 0.9) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const eventR = scale * 1.5;
            newPos[idx] = eventR * Math.sin(phi) * Math.cos(theta);
            newPos[idx + 1] = eventR * Math.sin(phi) * Math.sin(theta);
            newPos[idx + 2] = eventR * Math.cos(phi);
          }
          break;
        }
        case ParticleShape.DNA: {
          const helixRadius = scale * 1.5;
          const height = scale * 10;
          const turns = 4;

          const y = (t - 0.5) * height;
          const angle = (y / height) * Math.PI * 2 * turns;

          // Double helix
          const strand = i % 2 === 0 ? 0 : Math.PI;

          newPos[idx] = Math.cos(angle + strand) * helixRadius;
          newPos[idx + 1] = y;
          newPos[idx + 2] = Math.sin(angle + strand) * helixRadius;

          // Base pairs
          if (Math.random() > 0.8) {
            const linkT = Math.random();
            newPos[idx] = THREE.MathUtils.lerp(Math.cos(angle) * helixRadius, Math.cos(angle + Math.PI) * helixRadius, linkT);
            newPos[idx + 1] = y;
            newPos[idx + 2] = THREE.MathUtils.lerp(Math.sin(angle) * helixRadius, Math.sin(angle + Math.PI) * helixRadius, linkT);
          }
          break;
        }
        case ParticleShape.NEBULA: {
          // Cloud-like clusters
          const clusterCenters = 5;
          const clusterIdx = Math.floor(Math.random() * clusterCenters);

          const cx = (Math.random() - 0.5) * scale * 8;
          const cy = (Math.random() - 0.5) * scale * 8;
          const cz = (Math.random() - 0.5) * scale * 8;

          const r = Math.random() * scale * 3;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          newPos[idx] = cx + r * Math.sin(phi) * Math.cos(theta);
          newPos[idx + 1] = cy + r * Math.sin(phi) * Math.sin(theta);
          newPos[idx + 2] = cz + r * Math.cos(phi);
          break;
        }
        case ParticleShape.SUPERNOVA: {
          const explosionR = scale * Math.pow(Math.random(), 0.3) * 8;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          newPos[idx] = explosionR * Math.sin(phi) * Math.cos(theta);
          newPos[idx + 1] = explosionR * Math.sin(phi) * Math.sin(theta);
          newPos[idx + 2] = explosionR * Math.cos(phi);
          break;
        }
        case ParticleShape.VORTEX: {
          const angle = t * Math.PI * 100;
          const r = t * scale * 3;
          newPos[idx] = Math.cos(angle) * r;
          newPos[idx + 1] = (t - 0.5) * scale * 5;
          newPos[idx + 2] = Math.sin(angle) * r;
          break;
        }
        case ParticleShape.FLOWER_OF_LIFE: {
          const row = Math.floor(Math.sqrt(count));
          const x = (i % row - row / 2) * (scale / 15);
          const y = (Math.floor(i / row) - row / 2) * (scale / 15);
          newPos[idx] = x;
          newPos[idx + 1] = y;
          newPos[idx + 2] = Math.sin(Math.sqrt(x * x + y * y) * 0.2) * 10;
          break;
        }
        case ParticleShape.LOTUS: {
          const petals = 8;
          const angle = t * Math.PI * 40;
          const r = scale * 2 * Math.sin(petals * t * Math.PI) * Math.pow(t, 0.5);
          newPos[idx] = Math.cos(angle) * r;
          newPos[idx + 1] = t * scale * 4 - (scale * 2);
          newPos[idx + 2] = Math.sin(angle) * r;
          break;
        }
        case ParticleShape.HEART: {
          const angle = Math.random() * Math.PI * 2;
          const r = scale;
          newPos[idx] = r * 16 * Math.pow(Math.sin(angle), 3) / 16;
          newPos[idx + 1] = r * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) / 16;
          newPos[idx + 2] = (Math.random() - 0.5) * 10;
          break;
        }
        case ParticleShape.PYRAMID: {
          const h = scale * 10;
          const base = scale * 8;
          // 4 faces
          const face = Math.floor(Math.random() * 4);
          const u = Math.random();
          const v = Math.random();
          // Barycentric coords for triangle
          // But simpler: Lerp from apex to base line

          const apex = { x: 0, y: h / 2, z: 0 };
          let p1, p2;

          if (face === 0) { p1 = { x: -base, y: -h / 2, z: base }; p2 = { x: base, y: -h / 2, z: base }; }
          else if (face === 1) { p1 = { x: base, y: -h / 2, z: base }; p2 = { x: base, y: -h / 2, z: -base }; }
          else if (face === 2) { p1 = { x: base, y: -h / 2, z: -base }; p2 = { x: -base, y: -h / 2, z: -base }; }
          else { p1 = { x: -base, y: -h / 2, z: -base }; p2 = { x: -base, y: -h / 2, z: base }; }

          const edgePoint = {
            x: p1.x + (p2.x - p1.x) * u,
            y: p1.y + (p2.y - p1.y) * u,
            z: p1.z + (p2.z - p1.z) * u
          };

          // Lerp apex to edge
          const finalV = Math.sqrt(v); // bias towards base for uniform density

          newPos[idx] = apex.x + (edgePoint.x - apex.x) * finalV;
          newPos[idx + 1] = apex.y + (edgePoint.y - apex.y) * finalV;
          newPos[idx + 2] = apex.z + (edgePoint.z - apex.z) * finalV;
          break;
        }
        case ParticleShape.PHARAOH: {
          const r = Math.random();
          // Mask/Head
          if (r < 0.6) {
            // Face oval
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const xr = scale * 4;
            const yr = scale * 5.5;
            const zr = scale * 4;
            newPos[idx] = xr * Math.sin(phi) * Math.cos(theta);
            newPos[idx + 1] = yr * Math.cos(phi);
            newPos[idx + 2] = zr * Math.sin(phi) * Math.sin(theta) * 0.8; // flattened
          } else if (r < 0.9) {
            // Nemes (Headdress) - flared sides
            const side = Math.random() > 0.5 ? 1 : -1;
            const h = (Math.random() - 0.5) * scale * 12;
            const w = scale * 5 + Math.abs(h) * 0.4; // flares out
            newPos[idx] = side * (w + Math.random() * 2);
            newPos[idx + 1] = h;
            newPos[idx + 2] = (Math.random() - 0.5) * scale * 4;
          } else {
            // Beard
            const h = Math.random() * scale * 4;
            newPos[idx] = (Math.random() - 0.5) * scale;
            newPos[idx + 1] = -scale * 5 - h;
            newPos[idx + 2] = scale * 3 + (Math.random() - 0.5);
          }
          break;
        }
        case ParticleShape.DRAGON: {
          // Serpentine body
          const len = scale * 40;
          const seg = t * len - len / 2;
          // Sine wave spine
          const sx = seg;
          const sy = Math.sin(seg * 0.3) * scale * 3;
          const sz = Math.cos(seg * 0.2) * scale * 3;

          // Body volume
          const girth = scale * (2 + Math.sin(seg * 0.5));
          const theta = Math.random() * Math.PI * 2;
          const rad = Math.random() * girth;

          newPos[idx] = sx;
          newPos[idx + 1] = sy + rad * Math.cos(theta);
          newPos[idx + 2] = sz + rad * Math.sin(theta);

          // Head
          if (t > 0.95) {
            newPos[idx] += (Math.random() - 0.5) * scale * 4;
            newPos[idx + 1] += (Math.random() - 0.5) * scale * 4;
            newPos[idx + 2] += (Math.random() - 0.5) * scale * 4;
          }
          break;
        }
        case ParticleShape.PHOENIX: {
          // Body
          if (Math.random() < 0.2) {
            newPos[idx] = (Math.random() - 0.5) * scale * 2;
            newPos[idx + 1] = (Math.random() - 0.5) * scale * 10;
            newPos[idx + 2] = (Math.random() - 0.5) * scale * 2;
          } else {
            // Wings
            const side = Math.random() > 0.5 ? 1 : -1;
            const span = Math.random() * scale * 15;
            const curve = Math.pow(span / (scale * 15), 2) * scale * 10;

            newPos[idx] = side * span;
            newPos[idx + 1] = curve + (Math.random() - 0.5) * scale * 2; // Arched wings
            newPos[idx + 2] = -Math.abs(span) * 0.5 + (Math.random() - 0.5) * scale * 2; // Swept back
          }
          break;
        }
        default: {
          const r = scale * (1 + Math.random() * 2);
          const angle = Math.random() * Math.PI * 2;
          newPos[idx] = Math.cos(angle) * r;
          newPos[idx + 1] = (Math.random() - 0.5) * scale;
          newPos[idx + 2] = Math.sin(angle) * r;
        }
      }
    }
    targetPositions.current = newPos;
  }, [count, settings.particleLength]);

  useEffect(() => generateShape(shape), [shape, generateShape]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const colAttr = pointsRef.current.geometry.attributes.color;

    let cx = 0, cy = 0, cz = 0;
    let interacting = false;

    if (data.hands.length > 0) {
      const hand = data.hands[0];
      cx = hand.x * 20;
      cy = hand.y * 20;
      cz = hand.z * 20;
      interacting = true;

      // Hand interaction overrides manual rotation temporarily for dynamic feel
      cameraOrbit.current.theta = THREE.MathUtils.lerp(cameraOrbit.current.theta, -hand.x * 1.5, 0.05);
      cameraOrbit.current.phi = THREE.MathUtils.lerp(cameraOrbit.current.phi, (hand.y + 0.5) * Math.PI / 1.5, 0.05);
      warpFactor.current = THREE.MathUtils.lerp(warpFactor.current, hand.velocity * 50, 0.1);
    } else {
      // Cinematic Tour Logic
      if (settings.isTourActive) {
        const t = Date.now() * 0.0005 * (settings.speed || 1);
        // Complex orbital path for cinematic feel
        cameraOrbit.current.theta = Math.sin(t * 0.5) * 0.8 + t * 0.2;
        cameraOrbit.current.phi = Math.PI / 2 + Math.cos(t * 0.3) * 0.4;

        // Gentle breathing warp effect
        warpFactor.current = Math.sin(t * 2) * 0.5;
      }
      else if (settings.autoRotate) {
        cameraOrbit.current.theta += 0.003 * (settings.speed || 1);
      } else {
        // Manual Control
        const targetTheta = (settings.rotationX || 0) * (Math.PI / 180);
        const targetPhi = (settings.rotationY || 45) * (Math.PI / 180);
        cameraOrbit.current.theta = THREE.MathUtils.lerp(cameraOrbit.current.theta, targetTheta, 0.1);
        cameraOrbit.current.phi = THREE.MathUtils.lerp(cameraOrbit.current.phi, targetPhi, 0.1);
      }

      if (!settings.isTourActive) warpFactor.current *= 0.95;
      interacting = false;
    }

    interactionPoint.current.set(cx, cy, cz);

    // Extreme Zoom Logic Mapping (-50 to 50)
    let baseRadius = 120;

    // Zoom Logic
    const z = settings.zoom || 0;
    if (z > 0) {
      // Zoom IN: 0 to 50 -> Radius 120 to ~2
      baseRadius = 120 / (1 + z);
    } else {
      // Zoom OUT: 0 to -50 -> Radius 120 to 6000
      baseRadius = 120 * (1 + Math.abs(z));
    }

    // Dynamic Tour Camera Distance
    if (settings.isTourActive) {
      baseRadius *= (1 + Math.sin(Date.now() * 0.001) * 0.2);
    }

    const tx_cam = baseRadius * Math.sin(cameraOrbit.current.phi) * Math.cos(cameraOrbit.current.theta);
    const ty_cam = baseRadius * Math.cos(cameraOrbit.current.phi);
    const tz_cam = baseRadius * Math.sin(cameraOrbit.current.phi) * Math.sin(cameraOrbit.current.theta);

    // Smooth camera movement
    state.camera.position.lerp(new THREE.Vector3(tx_cam, ty_cam, tz_cam), 0.04);
    state.camera.lookAt(0, 0, 0);

    const baseColor = new THREE.Color(settings.themeColor);
    const influenceRadius = 45;
    const forceStrength = 0.6;

    // Global speed multiplier
    const speedMult = settings.speed || 1.0;
    const lerpFactor = 0.035 * speedMult;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const px = posAttr.array[idx];
      const py = posAttr.array[idx + 1];
      const pz = posAttr.array[idx + 2];

      const tx = targetPositions.current[idx];
      const ty = targetPositions.current[idx + 1];
      const tz = targetPositions.current[idx + 2];

      let vx = (tx - px) * lerpFactor;
      let vy = (ty - py) * lerpFactor;
      let vz = (tz - pz) * lerpFactor;

      // Add dynamic rotation based on shape type
      if (shape === ParticleShape.GALAXY) {
        const centerDist = Math.sqrt(px * px + pz * pz);
        const rotSpeed = 0.0005 * (1000 / (centerDist + 10)) * speedMult; // Faster near center
        const cos = Math.cos(rotSpeed);
        const sin = Math.sin(rotSpeed);

        // Rotate target position around Y axis
        const ntx = tx * cos - tz * sin;
        const ntz = tx * sin + tz * cos;
        targetPositions.current[idx] = ntx;
        targetPositions.current[idx + 2] = ntz;
      } else if (shape === ParticleShape.ATOMUS_PRIME) {
        // ATOMUS SWARM BEHAVIOR
        // If interacting, swarm the hand. If not, orbit center.
        const time = Date.now() * 0.001 * speedMult;

        if (interacting) {
          // Aggressive swarming to interaction point
          const orbitSpeed = 0.005 * speedMult; // Fast orbit
          const targetX = cx;
          const targetY = cy;
          const targetZ = cz;

          // Orbit around the target
          const dx = tx - targetX;
          const dz = tz - targetZ;
          const dist = Math.sqrt(dx * dx + dz * dz);

          // Spiral in/out
          const spiral = Math.sin(time * 2 + i * 0.1) * 5;

          // Rotate around target
          const cos = Math.cos(orbitSpeed * (dist + 1));
          const sin = Math.sin(orbitSpeed * (dist + 1));

          targetPositions.current[idx] = targetX + (dx * cos - dz * sin) + Math.sin(time * 5 + i) * 2;
          targetPositions.current[idx + 1] = targetY + Math.cos(time * 3 + i * 0.01) * 5; // Vertical oscillation
          targetPositions.current[idx + 2] = targetZ + (dx * sin + dz * cos) + Math.cos(time * 5 + i) * 2;

          // Override velocity for "Atomus" feel - sharp turns
          vx += (targetPositions.current[idx] - px) * 0.1 * speedMult;
          vy += (targetPositions.current[idx + 1] - py) * 0.1 * speedMult;
          vz += (targetPositions.current[idx + 2] - pz) * 0.1 * speedMult;
        } else {
          // Idle atomus: Chaotic orbitals
          const angle = time * 0.5 + i * 0.001;
          const r = 40 + Math.sin(time + i * 0.01) * 10;
          targetPositions.current[idx] = Math.cos(angle * (1 + (i % 3) * 0.5)) * r;
          targetPositions.current[idx + 1] = Math.sin(angle * (1 + (i % 2) * 0.5)) * r;
          targetPositions.current[idx + 2] = Math.sin(angle + Math.PI / 2) * r;
        }
      } else if (shape === ParticleShape.ATOMUS_FLOW) {
        // FLUID WAVE BEHAVIOR
        const time = Date.now() * 0.002 * speedMult;
        const x = initialPositions[idx];
        const z = initialPositions[idx + 2];

        // Multi-layered sine waves
        let y = Math.sin(x * 0.05 + time) * 5 + Math.cos(z * 0.05 + time * 1.5) * 5;

        // Interaction ripple
        if (interacting) {
          const dist = Math.sqrt((x - cx) * (x - cx) + (z - cz) * (z - cz));
          const ripple = Math.sin(dist * 0.2 - time * 5) * 10 * Math.exp(-dist * 0.05);
          y += ripple;
        }

        targetPositions.current[idx + 1] = y;
      } else if (shape === ParticleShape.ATOMUS_GRAVITY) {
        // BLACK HOLE / GRAVITY WELL
        const time = Date.now() * 0.001 * speedMult;

        if (interacting) {
          // Pull to hand
          const dx = cx - px;
          const dy = cy - py;
          const dz = cz - pz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;

          // Strong gravity
          const force = 500 / (dist * dist);
          vx += dx / dist * force * speedMult;
          vy += dy / dist * force * speedMult;
          vz += dz / dist * force * speedMult;

          // Event horizon swirl
          const swirlSpeed = (10 / dist) * speedMult;
          vx += -dz * swirlSpeed;
          vz += dx * swirlSpeed;
        } else {
          // Idle rotation
          const rotSpeed = 0.003 * speedMult;
          const cos = Math.cos(rotSpeed);
          const sin = Math.sin(rotSpeed);
          const ntx = tx * cos - tz * sin;
          const ntz = tx * sin + tz * cos;
          targetPositions.current[idx] = ntx;
          targetPositions.current[idx + 2] = ntz;
        }
      } else if (shape === ParticleShape.SOLAR_SYSTEM) {
        // Simple orbit logic for solar system
        const centerDist = Math.sqrt(px * px + pz * pz);
        if (centerDist > 50) { // Don't rotate sun
          const rotSpeed = 0.001 * speedMult;
          const cos = Math.cos(rotSpeed);
          const sin = Math.sin(rotSpeed);
          const ntx = tx * cos - tz * sin;
          const ntz = tx * sin + tz * cos;
          targetPositions.current[idx] = ntx;
          targetPositions.current[idx + 2] = ntz;
        }
      } else if (shape === ParticleShape.BLACK_HOLE) {
        const rotSpeed = 0.002 * speedMult;
        const cos = Math.cos(rotSpeed);
        const sin = Math.sin(rotSpeed);
        const ntx = tx * cos - tz * sin;
        const ntz = tx * sin + tz * cos;
        targetPositions.current[idx] = ntx;
        targetPositions.current[idx + 2] = ntz;
      }

      if (interacting) {
        const dx = cx - px;
        const dy = cy - py;
        const dz = cz - pz;
        const distSq = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSq);

        if (dist < influenceRadius && dist > 0.1) {
          const force = (1 - dist / influenceRadius) * forceStrength;
          vx += dx * force;
          vy += dy * force;
          vz += dz * force;

          const swirl = 0.25;
          vx += -dy * swirl * force;
          vy += dx * swirl * force;
        }
      }

      velocities.current[idx] = (velocities.current[idx] + vx) * 0.9;
      velocities.current[idx + 1] = (velocities.current[idx + 1] + vy) * 0.9;
      velocities.current[idx + 2] = (velocities.current[idx + 2] + vz) * 0.9;

      posAttr.array[idx] += velocities.current[idx] * (1 + warpFactor.current);
      posAttr.array[idx + 1] += velocities.current[idx + 1] * (1 + warpFactor.current);
      posAttr.array[idx + 2] += velocities.current[idx + 2] * (1 + warpFactor.current);

      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const proximity = interacting ? (1 - Math.min(1, Math.sqrt((cx - px) ** 2 + (cy - py) ** 2) / influenceRadius)) : 0;

      colAttr.array[idx] = THREE.MathUtils.lerp(baseColor.r, 1, proximity * 0.7 + speed * 1.5);
      colAttr.array[idx + 1] = THREE.MathUtils.lerp(baseColor.g, 0.9, proximity * 0.4);
      colAttr.array[idx + 2] = THREE.MathUtils.lerp(baseColor.b, 1, speed * 4);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} key={count}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={initialPositions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={initialColors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={settings.particleSize}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ data, shape, settings }) => (
  <div className="absolute inset-0 bg-black cursor-none" style={{ width: '100%', height: '100%' }}>
    <Canvas camera={{ position: [0, 50, 150], fov: 70, far: 20000 }} dpr={[1, 2]}>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5} />
      <Particles data={data} shape={shape} settings={settings} />
      {/* <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom intensity={2.0} luminanceThreshold={0.2} radius={0.8} />
        <ChromaticAberration offset={new THREE.Vector2(0.0012, 0.0012)} />
        <Noise opacity={0.03} />
      </EffectComposer> */}
    </Canvas>
  </div>
);
