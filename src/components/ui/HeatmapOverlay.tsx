import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useBlueprintContext } from '../../contexts/BlueprintContext';
import { useSessionHeatmap } from '../../contexts/SessionHeatmapContext';

const HeatmapOverlay = () => {
  const { blueprint } = useBlueprintContext();
  const { pathname } = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getHeatmapData, subscribe } = useSessionHeatmap();
  
  // Re-render when heatmap data changes
  const [, setTick] = useState(0);
  
  useEffect(() => {
    if (!blueprint) return;
    
    // Subscribe to heatmap updates
    const unsubscribe = subscribe(pathname, () => {
      setTick(t => t + 1);
    });
    
    return () => unsubscribe();
  }, [blueprint, pathname, subscribe]);

  // Get heatmap data from session context
  const heatmapData = blueprint ? getHeatmapData(pathname) : null;

  // Render heatmap on canvas
  useEffect(() => {
    if (!blueprint || !canvasRef.current || !heatmapData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw heatmap grid
    const gridSize = 10;
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    // Draw grid cells with heat colors
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const value = heatmapData.grid[y][x];
        if (value > 0) {
          const intensity = Math.min(value / heatmapData.maxValue, 1);
          
          // Simple green to red gradient
          const r = Math.floor(intensity * 255);
          const g = Math.floor((1 - intensity) * 200);
          const b = 0;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.25})`;
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    // Draw click hotspots (simplified)
    for (const click of heatmapData.clicks) {
      const x = (click.x / 100) * canvas.width;
      const y = (click.y / 100) * canvas.height;

      // Simple glowing dot for clicks
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#c4ff0e';
      ctx.fill();
    }

  }, [blueprint, heatmapData]);

  if (!blueprint) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[35]"
      />
      {/* Heatmap Stats HUD */}
      {heatmapData && (
        <div className="fixed bottom-32 left-10 z-[100] pointer-events-none select-none">
          <div className="bg-black/80 backdrop-blur-md border border-accent/30 rounded-xl p-4 font-mono text-[9px] space-y-2">
            <div className="flex items-center gap-2 border-b border-accent/20 pb-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-accent uppercase tracking-widest font-bold">Heatmap_Active</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-zinc-500">Click_Events</span>
              <span className="text-red-400 font-bold">{heatmapData.totalClicks}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-zinc-500">Movement_Points</span>
              <span className="text-accent font-bold">{heatmapData.totalMoves}</span>
            </div>
            <div className="flex justify-between gap-8 pt-2 border-t border-accent/20">
              <span className="text-zinc-600 text-[7px]">Session_Only</span>
              <span className="text-zinc-600 text-[7px]">Clears on Refresh</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeatmapOverlay;
