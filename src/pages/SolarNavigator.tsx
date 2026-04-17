import { Suspense, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Orbit, ArrowLeft } from 'lucide-react';
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
      <div className="solar-hud">
        {/* Top-left: Back + title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="solar-hud-topleft"
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

        {/* Top-right: Mode indicator */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="solar-hud-topright"
        >
          <div className="solar-mode-badge">
            <Orbit size={14} className="text-accent" />
            <span>Gravity_Nav</span>
          </div>
        </motion.div>

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
          className="solar-hud-legend"
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
