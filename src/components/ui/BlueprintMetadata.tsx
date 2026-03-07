import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useBlueprintContext } from '../../contexts/BlueprintContext';

const BlueprintMetadata = () => {
  const { blueprint, hoverMeta } = useBlueprintContext();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [side, setSide] = useState({ x: 1, y: 1 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setSide({
        x: e.clientX > window.innerWidth - 280 ? -1 : 1,
        y: e.clientY > window.innerHeight - 200 ? -1 : 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [diagnosticHex, setDiagnosticHex] = useState('000');
  useEffect(() => {
    if (hoverMeta) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiagnosticHex(Math.floor(Math.random() * 1000).toString(16).toUpperCase());
    }
  }, [hoverMeta]);

  if (!blueprint || !hoverMeta) return null;

  const targetX = mousePos.x + (side.x === 1 ? 25 : -225);
  const targetY = mousePos.y + (side.y === 1 ? 25 : -145);

  // Compute safe endpoint coordinates for the connection line
  const endX = hoverMeta.targetX ?? targetX;
  const endY = hoverMeta.targetY ?? targetY;
  const startX = targetX + (side.x === 1 ? 0 : 200);
  const startY = targetY + 20;

  // Only render the connection line when we have valid target coordinates
  const hasTarget = hoverMeta.targetX !== undefined && hoverMeta.targetY !== undefined;

  return (
    <>
      {/* Neural Connection Line */}
      {hasTarget && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-[140]">
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#c4ff0e"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <circle
            cx={endX}
            cy={endY}
            r="4"
            fill="#c4ff0e"
            opacity="0.4"
          />
        </svg>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: targetX, y: targetY }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: targetX,
          y: targetY
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ 
          x: { duration: 0 },
          y: { duration: 0 },
          opacity: { duration: 0.1 },
          scale: { type: "spring", damping: 25, stiffness: 400 }
        }}
        className="fixed top-0 left-0 z-[150] pointer-events-none p-4 bg-black/95 backdrop-blur-xl border border-accent/40 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_20px_rgba(196,255,14,0.15)] font-mono text-[9px] min-w-[200px]"
      >
      <div className="absolute inset-0 bg-accent/5 opacity-20 pointer-events-none overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(196,255,14,0.05)_25%,rgba(196,255,14,0.05)_26%,transparent_27%,transparent_74%,rgba(196,255,14,0.05)_75%,rgba(196,255,14,0.05)_76%,transparent_77%)] bg-[length:100%_4px]" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3 border-b border-accent/20 pb-2">
          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          <span className="text-accent font-bold uppercase tracking-widest">{hoverMeta.name}</span>
        </div>
        
        <div className="space-y-2.5">
          <div className="flex justify-between items-center gap-4">
            <span className="text-zinc-500 uppercase text-[7px] tracking-tighter">Geometric_Bounds</span>
            <span className="text-zinc-100 font-bold">{hoverMeta.bounds}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-zinc-500 uppercase text-[7px] tracking-tighter">Active_Behaviors</span>
            <span className="text-zinc-100 font-bold">{hoverMeta.props}</span>
          </div>
          
          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[7px] text-accent/60 uppercase">
              <Activity size={8} />
              <span>Diagnostic_OK</span>
            </div>
            <span className="text-[7px] text-zinc-700">0x{diagnosticHex}</span>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
};

export default BlueprintMetadata;
