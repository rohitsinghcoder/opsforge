import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function generateInitialData(count: number) {
  const anchors = new Float32Array(count * 3);
  const defaultColors = new Float32Array(count * 3);
  const colorInside = new THREE.Color('#ff6030'); // fiery orange
  const colorOutside = new THREE.Color('#1b3984'); // deep space blue

  for (let i = 0; i < count; i++) {
    const radius = Math.random() * 6;
    const spinAngle = radius * 4;
    const branchAngle = ((i % 4) * Math.PI * 2) / 4;

    const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5 * radius;
    const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5 * radius;
    const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5 * radius;

    anchors[i * 3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    anchors[i * 3 + 1] = randomY;
    anchors[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    const mixedColor = colorInside.clone().lerp(colorOutside, radius / 6);
    defaultColors[i * 3] = mixedColor.r;
    defaultColors[i * 3 + 1] = mixedColor.g;
    defaultColors[i * 3 + 2] = mixedColor.b;
  }
  
  // Create a strict copy for positions so they track back to anchors
  const defaultPositions = new Float32Array(anchors);
  
  return { anchors, positions: defaultPositions, colors: defaultColors };
}

export default function ParticleForge() {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const count = 10000;
  
  const [data] = useState(() => generateInitialData(count));
  const { anchors, positions, colors } = data;

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positionsAttr = pointsRef.current.geometry.attributes.position;
      const positionsArray = positionsAttr.array as Float32Array;

      pointsRef.current.rotation.y += delta * 0.05;
      
      const targetX = mouse.x * 8;
      const targetY = mouse.y * 8;
      
      const time = state.clock.elapsedTime;
      const lerpSpeed = delta * 5.0; // Higher lerp means they snap back faster

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        const ax = anchors[i3];
        const ay = anchors[i3 + 1];
        const az = anchors[i3 + 2];
        
        const cx = positionsArray[i3];
        const cy = positionsArray[i3 + 1];
        const cz = positionsArray[i3 + 2];

        const dx = targetX - cx;
        const dy = targetY - cy;
        const dz = 0 - cz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;

        let tx = ax;
        let ty = ay;
        let tz = az;

        // If they get within the black hole's influence radius
        if (dist < 4.0) {
          const pushStrength = (4.0 - dist) * 1.5;
          const swirlStrength = 3.0 / dist; // Tangential force

          // Deflect from origin, plus swirling
          tx = ax - (dx / dist) * pushStrength - dy * swirlStrength;
          ty = ay - (dy / dist) * pushStrength + dx * swirlStrength;
          
          // Inject vertical Z distortion based on time to prevent total layer flattening
          tz = az - (dz / dist) * pushStrength + Math.sin(time * 2.0 + ax) * 2.0; 
        }

        // Lerp strictly towards the calculated target
        positionsArray[i3] += (tx - cx) * lerpSpeed;
        positionsArray[i3 + 1] += (ty - cy) * lerpSpeed;
        positionsArray[i3 + 2] += (tz - cz) * lerpSpeed;
      }
      
      positionsAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}