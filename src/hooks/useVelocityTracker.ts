import { useState, useRef, useEffect } from 'react';

export const useVelocityTracker = () => {
  const [velocityHistory, setVelocityHistory] = useState<number[]>(new Array(20).fill(0));
  const lastMousePos = useRef({ x: 0, y: 0 });
  const targetVelocity = useRef(0);
  const smoothedVelocity = useRef(0);
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      // Lerp (smooth) the velocity for a "usage" feel
      // It climbs fast but drops slightly slower
      const lerpFactor = targetVelocity.current > smoothedVelocity.current ? 0.4 : 0.15;
      smoothedVelocity.current += (targetVelocity.current - smoothedVelocity.current) * lerpFactor;
      
      // Add baseline noise
      const noise = Math.random() * 2;
      const finalValue = smoothedVelocity.current + noise;
      
      setVelocityHistory(prev => [...prev.slice(1), Math.min(finalValue, 100)]);
      
      // Slowly reset target so it falls when mouse stops
      targetVelocity.current = Math.max(0, targetVelocity.current - 10);
    }, 60);

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate Velocity
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const velocity = Math.sqrt(dx*dx + dy*dy);
      
      if (lastMousePos.current.x !== 0) {
        // Map velocity to a "Usage" level
        targetVelocity.current = Math.min(velocity * 2, 100);
      }
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      setCoords(prev => ({
        ...prev,
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * -2 + 1
      }));
    };

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setCoords(prev => ({ ...prev, z: scrollPercent }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { velocityHistory, coords };
};

export default useVelocityTracker;
