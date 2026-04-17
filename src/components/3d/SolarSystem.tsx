import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import Planet from './Planet';
import OrbitRing from './OrbitRing';

interface SolarSystemProps {
  onNavigate: (route: string) => void;
  onHoverPlanet?: (label: string | null) => void;
  blueprint?: boolean;
  isSignedIn?: boolean;
}

const PLANETS = [
  {
    label: 'Works',
    route: '/works',
    geometry: 'icosahedron' as const,
    color: '#6366f1',
    emissive: '#6366f1',
    orbitRadius: 5,
    orbitSpeed: 0.25,
    size: 0.45,
    tilt: 0.1,
  },
  {
    label: 'Archive',
    route: '/archive',
    geometry: 'torusKnot' as const,
    color: '#a78bfa',
    emissive: '#a78bfa',
    orbitRadius: 7,
    orbitSpeed: 0.18,
    size: 0.35,
    tilt: -0.15,
  },
  {
    label: 'Ideas',
    route: '/ideas',
    geometry: 'dodecahedron' as const,
    color: '#facc15',
    emissive: '#facc15',
    orbitRadius: 9,
    orbitSpeed: 0.13,
    size: 0.4,
    tilt: 0.2,
  },
  {
    label: 'Playground',
    route: '/playground',
    geometry: 'octahedron' as const,
    color: '#34d399',
    emissive: '#34d399',
    orbitRadius: 11.5,
    orbitSpeed: 0.09,
    size: 0.38,
    tilt: -0.1,
  },
  {
    label: 'Contact',
    route: '/contact',
    geometry: 'sphere' as const,
    color: '#f472b6',
    emissive: '#f472b6',
    orbitRadius: 14,
    orbitSpeed: 0.06,
    size: 0.42,
    tilt: 0.12,
  },
  {
    label: 'Vault',
    route: '/vault',
    geometry: 'box' as const,
    color: '#c4ff0e',
    emissive: '#c4ff0e',
    orbitRadius: 16.5,
    orbitSpeed: 0.04,
    size: 0.36,
    tilt: -0.18,
  },
];

const SolarSystem = ({ onNavigate, onHoverPlanet, blueprint = false, isSignedIn = false }: SolarSystemProps) => {
  const { camera } = useThree();
  const sunRef = useRef<THREE.Mesh>(null);
  const [flyTarget, setFlyTarget] = useState<THREE.Vector3 | null>(null);
  const [flyRoute, setFlyRoute] = useState<string | null>(null);
  const flyProgressRef = useRef(0);
  const initialCamPos = useRef(new THREE.Vector3(8, 12, 18));

  // Initialize camera on mount
  useEffect(() => {
    camera.position.copy(initialCamPos.current);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Pre-compute reusable objects to avoid per-frame GC pressure
  const _approachOffset = useMemo(() => new THREE.Vector3(2, 1.5, 3).normalize().multiplyScalar(3), []);
  const _targetCamPos = useMemo(() => new THREE.Vector3(), []);
  const _lookTarget = useMemo(() => new THREE.Vector3(), []);
  const _origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  // Pre-compute glow materials (shared, never re-created)
  const sunGlowMat1 = useMemo(() => new THREE.MeshBasicMaterial({
    color: blueprint ? '#c4ff0e' : '#4338ca',
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
  }), [blueprint]);

  const sunGlowMat2 = useMemo(() => new THREE.MeshBasicMaterial({
    color: blueprint ? '#c4ff0e' : '#4338ca',
    transparent: true,
    opacity: 0.025,
    depthWrite: false,
  }), [blueprint]);

  // Pre-compute geometries (shared)
  const glowGeo1 = useMemo(() => new THREE.SphereGeometry(2.4, 16, 16), []);
  const glowGeo2 = useMemo(() => new THREE.SphereGeometry(3.2, 16, 16), []);

  // Single unified useFrame for sun rotation + camera fly animation
  useFrame((_, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.15;
      sunRef.current.rotation.x += delta * 0.1;
    }

    if (flyTarget && flyRoute) {
      flyProgressRef.current += delta * 0.8;
      const t = Math.min(flyProgressRef.current, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      _targetCamPos.copy(flyTarget).add(_approachOffset);
      camera.position.lerpVectors(initialCamPos.current, _targetCamPos, eased);
      _lookTarget.lerpVectors(_origin, flyTarget, eased);
      camera.lookAt(_lookTarget);

      if (t >= 1) {
        onNavigate(flyRoute);
        setFlyTarget(null);
        setFlyRoute(null);
        flyProgressRef.current = 0;
        camera.position.copy(initialCamPos.current);
        camera.lookAt(0, 0, 0);
      }
    }
  });

  const handlePlanetClick = useCallback((route: string, position: THREE.Vector3) => {
    if (flyTarget) return;
    setFlyTarget(position);
    setFlyRoute(route);
    flyProgressRef.current = 0;
  }, [flyTarget]);

  const isFlying = flyTarget !== null;

  return (
    <>
      {/* Starfield — reduced from 2500 to 1200 */}
      <Stars
        radius={80}
        depth={60}
        count={1200}
        factor={4}
        saturation={0}
        fade
        speed={0.3}
      />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#c4ff0e" distance={50} decay={2} />
      <pointLight position={[20, 15, 10]} intensity={0.5} color="#ffffff" />

      {/* Sun — reduced geometry from 64x64 to 48x48, removed Float wrapper */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[1.6, 48, 48]} />
        <MeshDistortMaterial
          color={blueprint ? '#c4ff0e' : '#4338ca'}
          speed={2}
          distort={0.35}
          radius={1}
          wireframe={blueprint}
          metalness={0.9}
          roughness={0.1}
          emissive={blueprint ? '#c4ff0e' : '#4338ca'}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Sun glow — reduced from 32 segments to 16 */}
      <mesh geometry={glowGeo1} material={sunGlowMat1} />
      <mesh geometry={glowGeo2} material={sunGlowMat2} />

      {/* Orbit Rings */}
      {PLANETS.map((planet) => (
        <OrbitRing
          key={`ring-${planet.route}`}
          radius={planet.orbitRadius}
          color={planet.color}
          opacity={0.06}
          tilt={planet.tilt}
        />
      ))}

      {/* Planets */}
      {PLANETS.map((planet) => (
        <Planet
          key={planet.route}
          {...planet}
          onClick={handlePlanetClick}
          onHover={onHoverPlanet}
          locked={planet.route === '/vault' && !isSignedIn}
          isFlying={isFlying}
        />
      ))}
    </>
  );
};

export default SolarSystem;
