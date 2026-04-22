import { Suspense, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useBlueprintContext } from '../contexts/BlueprintContext';
import { usePageTitle } from '../hooks/usePageTitle';
import SolarSystem from '../components/3d/SolarSystem';

const PLANET_COLORS: Record<string, string> = {
  Works: '#6366f1',
  Archive: '#a78bfa',
  Ideas: '#facc15',
  Playground: '#34d399',
  Contact: '#f472b6',
  Vault: '#c4ff0e',
};

const PLANET_DATA: Record<string, { desc: string; status: string; module: string }> = {
  Works: { 
    desc: 'Neural mapping of high-fidelity project deployments. Primary production sector.',
    status: 'ACTIVE_DEPLOYMENTS',
    module: 'PROD_01'
  },
  Archive: { 
    desc: 'Cold-storage for legacy artifacts and experimental historical data.',
    status: 'OPTIMIZED_STORAGE',
    module: 'ARC_02'
  },
  Ideas: { 
    desc: 'The Forge. Synthetic idea generation and blueprint synthesis.',
    status: 'FORGING_REALITY',
    module: 'FORGE_03'
  },
  Playground: { 
    desc: 'Sandboxed environment for real-time code mutation and experimentation.',
    status: 'READY_FOR_INPUT',
    module: 'SAND_04'
  },
  Contact: { 
    desc: 'Secure communication uplink for external entity interactions.',
    status: 'SIGNAL_WAITING',
    module: 'COMMS_05'
  },
  Vault: { 
    desc: 'Encrypted storage for proprietary assets and classified blueprints.',
    status: 'ENCRYPTED',
    module: 'SEC_06'
  },
};

const SolarNavigator = () => {
  usePageTitle('Navigate');
  const navigate = useNavigate();
  const { blueprint } = useBlueprintContext();
  const { isSignedIn } = useAuth();
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  const handleHoverPlanet = useCallback((label: string | null) => {
    setHoveredPlanet(label);
  }, []);

  return (
    <div className="solar-navigator">
      {/* Full-screen 3D Canvas */}
      <Canvas
        camera={{ position: [8, 12, 18], fov: 50, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        className="solar-canvas"
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <AdaptiveDpr pixelated />
          <SolarSystem
            onNavigate={handleNavigate}
            onHoverPlanet={handleHoverPlanet}
            blueprint={blueprint}
            isSignedIn={isSignedIn ?? false}
          />
        </Suspense>
      </Canvas>

      {/* HUD Overlay */}
      <div className="solar-hud pointer-events-none">
        {/* Top-left: Back + title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="solar-hud-topleft pointer-events-auto"
        >
          <button
            onClick={() => navigate('/')}
            className="solar-back-btn"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="solar-title">Navigation</h1>
            <p className="solar-subtitle">System_Map // Orbital_View</p>
          </div>
        </motion.div>

        {/* Top-right: AI Data Feed */}
        <AnimatePresence>
          {hoveredPlanet && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              className="absolute top-8 right-8 w-64 bg-black/40 backdrop-blur-xl border-r-2 border-accent p-4 pointer-events-auto"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Neural_Briefing</span>
              </div>
              <h3 className="text-white font-black uppercase tracking-tighter mb-1">{hoveredPlanet}</h3>
              <p className="text-[10px] font-mono text-zinc-500 mb-3">{PLANET_DATA[hoveredPlanet]?.module} // {PLANET_DATA[hoveredPlanet]?.status}</p>
              <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                {PLANET_DATA[hoveredPlanet]?.desc}
              </p>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                 <div className="flex justify-between items-center text-[8px] font-mono text-zinc-600">
                    <span>SECTOR_SCAN</span>
                    <span className="text-accent">100%</span>
                 </div>
                 <div className="w-full h-[2px] bg-white/5 mt-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className="h-full bg-accent" 
                    />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hovered planet label — shows in center-top when hovering a planet */}
        <AnimatePresence>
          {hoveredPlanet && (
            <motion.div
              key={hoveredPlanet}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="solar-hover-label"
            >
              <span
                className="solar-legend-dot"
                style={{ backgroundColor: PLANET_COLORS[hoveredPlanet] || '#fff' }}
              />
              <span>{hoveredPlanet}</span>
              <span style={{ color: '#52525b', marginLeft: 4 }}>// Click to explore</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom-center: Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="solar-hud-bottom"
        >
          <p className="solar-instructions">
            Click a planet to explore • Scroll to zoom • Drag to rotate
          </p>
        </motion.div>

        {/* Bottom-left: Planet legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="solar-hud-legend pointer-events-auto"
        >
          <p className="solar-legend-title">Orbital_Registry</p>
          <div className="solar-legend-list">
            {Object.entries(PLANET_COLORS).map(([label, color]) => (
              <div key={label} className="solar-legend-item">
                <span className="solar-legend-dot" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SolarNavigator;
