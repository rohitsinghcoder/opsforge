import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import MorphingObject from '../3d/MorphingObject';

interface SystemBackgroundProps {
  lowPowerMode: boolean;
  blueprint: boolean;
}

const SystemBackground = ({ lowPowerMode, blueprint }: SystemBackgroundProps) => {
  if (lowPowerMode) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <MorphingObject blueprint={blueprint} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SystemBackground;
