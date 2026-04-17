import { useRef, useEffect, useState } from 'react';

/**
 * Lightweight FPS monitor that uses rAF timing.
 * Renders a fixed overlay showing current FPS, average FPS,
 * and frame time. Toggle visibility with `visible` prop.
 */
const FpsCounter = ({ visible = true }: { visible?: boolean }) => {
  const [stats, setStats] = useState({ fps: 0, avg: 0, frameTime: 0 });
  const fpsHistoryRef = useRef<number[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!visible) return;

    let prevTime = performance.now();
    let frames = 0;

    const tick = (now: number) => {
      frames++;
      const delta = now - prevTime;

      if (delta >= 500) {
        const fps = Math.round((frames * 1000) / delta);
        const frameTime = +(delta / frames).toFixed(1);

        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 60) fpsHistoryRef.current.shift();

        const avg = Math.round(
          fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
        );

        setStats({ fps, avg, frameTime });
        frames = 0;
        prevTime = now;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  if (!visible) return null;

  const fpsColor = stats.fps >= 55 ? '#34d399' : stats.fps >= 30 ? '#facc15' : '#f87171';

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        display: 'flex',
        gap: '12px',
        padding: '6px 14px',
        borderRadius: '9999px',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#a1a1aa',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <span>
        FPS: <span style={{ color: fpsColor, fontWeight: 700 }}>{stats.fps}</span>
      </span>
      <span>
        AVG: <span style={{ fontWeight: 700 }}>{stats.avg}</span>
      </span>
      <span>
        Frame: <span style={{ fontWeight: 700 }}>{stats.frameTime}ms</span>
      </span>
    </div>
  );
};

export default FpsCounter;
