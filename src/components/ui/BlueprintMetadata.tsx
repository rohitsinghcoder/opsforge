import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useBlueprintContext } from '../../contexts/BlueprintContext';

const BlueprintMetadata = () => {
  const { blueprint, hoverMeta } = useBlueprintContext();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const diagnosticHex = useMemo(() => {
    if (!hoverMeta) return '000';

    const source = `${hoverMeta.name}|${hoverMeta.bounds}|${hoverMeta.props}|${hoverMeta.targetX ?? ''}|${hoverMeta.targetY ?? ''}`;
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) | 0;
    }

    return Math.abs(hash % 0xfff).toString(16).toUpperCase().padStart(3, '0');
  }, [hoverMeta]);

  const updatePosition = useCallback(() => {
    if (!tooltipRef.current) return;
    const { x, y } = mousePosRef.current;
    const sideX = x > window.innerWidth - 280 ? -1 : 1;
    const sideY = y > window.innerHeight - 200 ? -1 : 1;

    const tx = x + (sideX === 1 ? 25 : -225);
    const ty = y + (sideY === 1 ? 25 : -145);

    tooltipRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;

    if (lineRef.current && circleRef.current) {
      const endX = String(hoverMeta?.targetX ?? tx);
      const endY = String(hoverMeta?.targetY ?? ty);
      const startX = String(tx + (sideX === 1 ? 0 : 200));
      const startY = String(ty + 20);

      lineRef.current.setAttribute('x1', startX);
      lineRef.current.setAttribute('y1', startY);
      lineRef.current.setAttribute('x2', endX);
      lineRef.current.setAttribute('y2', endY);
      circleRef.current.setAttribute('cx', endX);
      circleRef.current.setAttribute('cy', endY);
    }
  }, [hoverMeta]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      updatePosition();
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updatePosition]);

  if (!blueprint || !hoverMeta) return null;

  const hasTarget = hoverMeta.targetX !== undefined && hoverMeta.targetY !== undefined;

  return (
    <>
      {hasTarget && (
        <svg ref={svgRef} className="fixed inset-0 w-full h-full pointer-events-none z-[140]">
          <line
            ref={lineRef}
            stroke="#c4ff0e"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <circle
            ref={circleRef}
            r="4"
            fill="#c4ff0e"
            opacity="0.4"
          />
        </svg>
      )}

      <div
        ref={tooltipRef}
        className="fixed top-0 left-0 z-[150] pointer-events-none p-4 bg-black/95 backdrop-blur-xl border border-accent/40 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_20px_rgba(196,255,14,0.15)] font-mono text-[9px] min-w-[200px]"
        style={{ willChange: 'transform' }}
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
      </div>
    </>
  );
};

export default BlueprintMetadata;
