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

  if (!blueprint || !hoverMeta) return null;

  const targetX = mousePos.x + (side.x === 1 ? 25 : -225);
  const targetY = mousePos.y + (side.y === 1 ? 25 : -145);

  return (
    <>
      {/* Neural Connection Line */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[140]">
        <motion.line
          x1={targetX + (side.x === 1 ? 0 : 200)}
          y1={targetY + 20}
          x2={hoverMeta.targetX || targetX}
          y2={hoverMeta.targetY || targetY}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            x1: targetX + (side.x === 1 ? 0 : 200),
            y1: targetY + 20,
            x2: hoverMeta.targetX || targetX,
            y2: hoverMeta.targetY || targetY,
            pathLength: 1,
            opacity: 0.4
          }}
          transition={{ x1: { duration: 0 }, y1: { duration: 0 }, x2: { duration: 0 }, y2: { duration: 0 } }}
          stroke="#c4ff0e"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <motion.circle
          cx={hoverMeta.targetX || targetX}
          cy={hoverMeta.targetY || targetY}
          initial={{ opacity: 0.2, scale: 1 }}
          animate={{ 
            cx: hoverMeta.targetX || targetX,
            cy: hoverMeta.targetY || targetY,
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{ cx: { duration: 0 }, cy: { duration: 0 }, repeat: Infinity, duration: 2 }}
          r="4"
          fill="#c4ff0e"
        />
      </svg>

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
            <span className="text-[7px] text-zinc-700">0x{Math.floor(Math.random() * 1000).toString(16).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
};

export default BlueprintMetadata;
