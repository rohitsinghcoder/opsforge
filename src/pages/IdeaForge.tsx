import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import ParticleForge from '../components/3d/ParticleForge';
import { usePageTitle } from '../hooks/usePageTitle';
import useHeatmapTracking from '../hooks/useHeatmapTracking';

export default function IdeaForge() {
  usePageTitle('Idea Forge');
  useHeatmapTracking('/forge');

  return (
    <div className="w-full h-screen bg-bg relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 3, 8], fov: 60 }}>
          <color attach="background" args={['#030508']} />
          <ambientLight intensity={0.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
            <ParticleForge />
          </Float>
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.5} 
            maxDistance={15}
            minDistance={2}
          />
        </Canvas>
      </div>

      <div className="absolute top-1/3 left-10 md:left-24 z-10 pointer-events-none select-none">
        <div className="border-l-2 border-[#ff6030] pl-6 py-2">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-4 drop-shadow-lg" style={{ textShadow: '0 0 30px rgba(255,96,48,0.4)' }}>
            THE FORGE
          </h1>
          <p className="text-gray-300 font-mono text-sm md:text-base max-w-md leading-relaxed">
            Raw ideas coalescing in the creative vacuum. <br/><br/>
            Interact with the nebula. Drag to rotate, scroll to zoom.
          </p>
        </div>
      </div>
    </div>
  );
}