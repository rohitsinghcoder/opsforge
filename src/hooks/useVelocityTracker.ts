import { useRef, useEffect, useCallback } from 'react';

export interface VelocityRefs {
  /** Attach this ref to the SVG <polyline> element that displays velocity */
  polylineRef: React.RefObject<SVGPolylineElement | null>;
  /** Current normalised mouse coordinates — read from ref, never triggers re-render */
  coordsRef: React.RefObject<{ x: number; y: number; z: number }>;
}

/**
 * High-performance velocity tracker that uses ONLY refs — zero React re-renders.
 * 
 * Instead of returning state values that trigger cascading re-renders on every
 * mouse movement, this hook:
 * - Stores all data in refs
 * - Updates the velocity SVG polyline via direct DOM mutation
 * - Exposes coordsRef for the blueprint HUD to read on a polling interval
 */
export const useVelocityTracker = (): VelocityRefs => {
  const polylineRef = useRef<SVGPolylineElement | null>(null);
  const coordsRef = useRef({ x: 0, y: 0, z: 0 });
  const velocityHistoryRef = useRef<number[]>(new Array(20).fill(0));
  const lastMousePos = useRef({ x: 0, y: 0 });
  const targetVelocity = useRef(0);
  const smoothedVelocity = useRef(0);

  // Update the SVG polyline directly — no React state involved
  const updatePolyline = useCallback(() => {
    if (!polylineRef.current) return;
    const points = velocityHistoryRef.current
      .map((v, i) => `${i * 5},${30 - (v / 100) * 30}`)
      .join(' ');
    polylineRef.current.setAttribute('points', points);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;

      const lerpFactor = targetVelocity.current > smoothedVelocity.current ? 0.4 : 0.15;
      smoothedVelocity.current += (targetVelocity.current - smoothedVelocity.current) * lerpFactor;

      const noise = Math.random() * 2;
      const finalValue = Math.min(smoothedVelocity.current + noise, 100);

      const history = velocityHistoryRef.current;
      history.shift();
      history.push(finalValue);

      updatePolyline();

      targetVelocity.current = Math.max(0, targetVelocity.current - 10);
    }, 200); // Was 60ms — reduced to 200ms (5 updates/sec is plenty for a sparkline)

    let rAFQueued = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate velocity (no state updates)
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const velocity = Math.sqrt(dx * dx + dy * dy);

      if (lastMousePos.current.x !== 0) {
        targetVelocity.current = Math.min(velocity * 2, 100);
      }

      lastMousePos.current = { x: e.clientX, y: e.clientY };

      // Debounce coordinate update to next rAF — collapses multiple moves into one
      if (!rAFQueued) {
        rAFQueued = true;
        requestAnimationFrame(() => {
          coordsRef.current = {
            x: (lastMousePos.current.x / window.innerWidth) * 2 - 1,
            y: (lastMousePos.current.y / window.innerHeight) * -2 + 1,
            z: coordsRef.current.z,
          };
          rAFQueued = false;
        });
      }
    };

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      coordsRef.current = { ...coordsRef.current, z: scrollPercent || 0 };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updatePolyline]);

  return { polylineRef, coordsRef };
};

export default useVelocityTracker;
