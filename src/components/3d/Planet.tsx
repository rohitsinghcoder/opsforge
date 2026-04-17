import { useRef, useCallback, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type PlanetGeometry = 'sphere' | 'icosahedron' | 'torusKnot' | 'dodecahedron' | 'octahedron' | 'box';

interface PlanetProps {
  label: string;
  route: string;
  geometry: PlanetGeometry;
  color: string;
  emissive: string;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  tilt?: number;
  onClick: (route: string, position: THREE.Vector3) => void;
  onHover?: (label: string | null) => void;
  locked?: boolean;
  isFlying?: boolean;
}

const Planet = ({
  label,
  route,
  geometry,
  color,
  emissive,
  orbitRadius,
  orbitSpeed,
  size,
  tilt = 0,
  onClick,
  onHover,
  locked = false,
  isFlying = false,
}: PlanetProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const mainMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const hoveredRef = useRef(false);
  const [initialAngle] = useState(() => Math.random() * Math.PI * 2);
  const angleRef = useRef(initialAngle);

  useFrame((_, delta) => {
    const speedMultiplier = isFlying ? 0.05 : 1;
    angleRef.current += orbitSpeed * delta * speedMultiplier;

    if (groupRef.current) {
      const x = Math.cos(angleRef.current) * orbitRadius;
      const z = Math.sin(angleRef.current) * orbitRadius;
      const y = Math.sin(angleRef.current) * Math.sin(tilt) * orbitRadius * 0.15;
      groupRef.current.position.set(x, y, z);
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }

    // Update emissive intensity based on hover (no React re-render)
    if (mainMaterialRef.current) {
      const targetIntensity = hoveredRef.current ? 1.2 : 0.4;
      mainMaterialRef.current.emissiveIntensity += (targetIntensity - mainMaterialRef.current.emissiveIntensity) * 0.1;
    }

    // Update glow opacity based on hover (no React re-render)
    if (glowMaterialRef.current) {
      const targetOpacity = hoveredRef.current ? 0.12 : 0.04;
      glowMaterialRef.current.opacity += (targetOpacity - glowMaterialRef.current.opacity) * 0.1;
    }

    const targetScale = hoveredRef.current ? size * 1.25 : size;
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    if (glowRef.current) {
      const targetGlowScale = targetScale * 1.4;
      glowRef.current.scale.lerp(new THREE.Vector3(targetGlowScale, targetGlowScale, targetGlowScale), 0.1);
    }
  });

  const handleClick = useCallback(() => {
    if (groupRef.current) {
      onClick(route, groupRef.current.position.clone());
    }
  }, [onClick, route]);

  const handlePointerOver = useCallback(() => {
    hoveredRef.current = true;
    onHover?.(label);
    document.body.style.cursor = 'pointer';
  }, [label, onHover]);

  const handlePointerOut = useCallback(() => {
    hoveredRef.current = false;
    onHover?.(null);
    document.body.style.cursor = 'default';
  }, [onHover]);

  const geometryObject = useMemo(() => {
    switch (geometry) {
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(1, 0);
      case 'torusKnot':
        return new THREE.TorusKnotGeometry(0.7, 0.25, 32, 8);
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(1, 0);
      case 'octahedron':
        return new THREE.OctahedronGeometry(1, 0);
      case 'box':
        return new THREE.BoxGeometry(1.3, 1.3, 1.3);
      case 'sphere':
      default:
        return new THREE.SphereGeometry(1, 16, 16);
    }
  }, [geometry]);

  // Glow sphere geometry — shared, low-poly
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={size}
        geometry={geometryObject}
      >
        <meshStandardMaterial
          ref={mainMaterialRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.3}
          wireframe={locked}
          transparent={locked}
          opacity={locked ? 0.5 : 1}
        />
      </mesh>

      {/* Glow effect — low-poly sphere */}
      <mesh ref={glowRef} scale={size * 1.4} geometry={glowGeometry}>
        <meshBasicMaterial
          ref={glowMaterialRef}
          color={emissive}
          transparent={true}
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default Planet;
