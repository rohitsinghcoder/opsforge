import { useRef, useEffect } from 'react';
import { useSessionHeatmap } from '../contexts/SessionHeatmapContext';

export const useHeatmapTracking = (pathname: string) => {
  const { addInteraction, addClick } = useSessionHeatmap();
  
  // Session ID for tracking (persists across page loads within session)
  const sessionId = useRef(
    typeof window !== 'undefined' 
      ? sessionStorage.getItem('echo_session') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : 'server'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('echo_session', sessionId.current);
    }
  }, []);

  // Track mouse movements (heavily throttled for performance)
  useEffect(() => {
    let lastMoveTime = 0;
    let lastX = 0;
    let lastY = 0;
    const throttleMs = 1000; // Only record every 1 second
    const minDistance = 10; // Minimum movement in % to record

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < throttleMs) return;

      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      // Only record if moved significantly
      const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
      if (distance < minDistance && lastX !== 0) return;

      lastMoveTime = now;
      lastX = x;
      lastY = y;

      addInteraction({
        sessionId: sessionId.current,
        path: pathname,
        type: 'move',
        x,
        y,
        timestamp: now,
      });
    };

    const handleClick = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      addClick(sessionId.current, pathname, x, y);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [pathname, addInteraction, addClick]);

  return { sessionId: sessionId.current };
};

export default useHeatmapTracking;
