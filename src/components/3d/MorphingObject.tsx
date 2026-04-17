import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface MorphingObjectProps {
  blueprint: boolean;
}

const sharedSphereGeometry = new THREE.SphereGeometry(1, 64, 64);

const MorphingObject = ({ blueprint }: MorphingObjectProps) => {
  const mesh = useRef<THREE.Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const material = useRef<any>(null);
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      
      // Add subtle parallax effect based on pointer
      mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, state.pointer.x * 0.5, 0.05);
      mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, state.pointer.y * 0.5, 0.05);
    }

    if (material.current) {
      // Calculate distance of pointer from center
      const pointerDist = Math.sqrt(state.pointer.x ** 2 + state.pointer.y ** 2);
      
      // Target values based on pointer distance
      const targetDistort = 0.3 + pointerDist * 0.3;
      const targetSpeed = 2 + pointerDist * 4;
      
      // Smoothly interpolate current values to target values
      material.current.distort = THREE.MathUtils.lerp(material.current.distort, targetDistort, 0.05);
      material.current.speed = THREE.MathUtils.lerp(material.current.speed, targetSpeed, 0.05);
    }
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={2}>
      <mesh ref={mesh} geometry={sharedSphereGeometry}>
        <MeshDistortMaterial
          ref={material}
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