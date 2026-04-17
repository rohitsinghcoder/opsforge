import { useMemo } from 'react';
import * as THREE from 'three';

interface OrbitRingProps {
  radius: number;
  color?: string;
  opacity?: number;
  tilt?: number;
}

const OrbitRing = ({ radius, color = '#ffffff', opacity = 0.08, tilt = 0 }: OrbitRingProps) => {
  const lineObj = useMemo(() => {
    // Reduced from 128 segments to 64 — barely noticeable visual difference
    const segments = 64;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, [radius, color, opacity]);

  return (
    <group rotation={[tilt, 0, 0]}>
      <primitive object={lineObj} />
    </group>
  );
};

export default OrbitRing;
