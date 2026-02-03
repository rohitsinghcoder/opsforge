import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface MorphingObjectProps {
  blueprint: boolean;
}

const MorphingObject = ({ blueprint }: MorphingObjectProps) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={2}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshDistortMaterial
          color={blueprint ? "#c4ff0e" : "#4338ca"}
          speed={4}
          distort={0.5}
          radius={1}
          wireframe={blueprint}
          metalness={0.8}
          roughness={0.2}
          emissive={blueprint ? "#c4ff0e" : "#000000"}
          emissiveIntensity={blueprint ? 0.5 : 0}
        />
      </mesh>
    </Float>
  );
};

export default MorphingObject;
