import { useRef, useEffect, useState, useMemo } from 'react';
import { Activity, Box, Tag, Layers, Type, PaintBucket } from 'lucide-react';
import { useBlueprintContext } from '../../contexts/BlueprintContext';

interface DOMNodeMetadata {
  tagName: string;
  id: string;
  className: string;
  width: number;
  height: number;
  display: string;
  position: string;
  color: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: string;
  padding: string;
  margin: string;
  top: number;
  left: number;
}

const BlueprintMetadata = () => {
  const { blueprint, hoverMeta } = useBlueprintContext();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [nodeMeta, setNodeMeta] = useState<DOMNodeMetadata | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!blueprint) return;

    // Track mouse to move tooltip
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    // Extract precise computed styles and bounds from whatever the mouse is over
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Do not inspect the inspector itself
      if (target.closest('#blueprint-inspector') || target.closest('#blueprint-overlay-box')) {
        return;
      }
      
      const rect = target.getBoundingClientRect();
      const style = window.getComputedStyle(target);
      
      // Attempt to get a nice class name string
      let classString = '';
      if (typeof target.className === 'string' && target.className.trim() !== '') {
        classString = '.' + target.className.trim().replace(/\s+/g, '.');
      }

      setNodeMeta({
        tagName: target.tagName.toLowerCase(),
        id: target.id ? `#${target.id}` : '',
        className: classString.length > 30 ? classString.substring(0, 30) + '...' : classString,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: rect.top,
        left: rect.left,
        display: style.display,
        position: style.position,
        color: style.color,
        backgroundColor: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : style.backgroundColor,
        fontFamily: style.fontFamily.split(',')[0].replace(/['"]/g, ''),
        fontSize: style.fontSize,
        padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`.trim().replace(/(0px\s?)+/g, '0 '),
        margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`.trim().replace(/(0px\s?)+/g, '0 '),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    // Initial trigger to grab element under current mouse position
    const elUnderMouse = document.elementFromPoint(mousePos.x, mousePos.y) as HTMLElement;
    if (elUnderMouse) {
      handleMouseOver({ target: elUnderMouse } as unknown as MouseEvent);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  // We disable exhaustive deps here intentionally to only rely on blueprint state toggles
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprint]);

  // Position the tooltip next to the mouse dynamically, never going offscreen
  useEffect(() => {
    if (!tooltipRef.current || !blueprint) return;
    const { x, y } = mousePos;
    const tooltipReact = tooltipRef.current.getBoundingClientRect();
    const padding = 20;
    
    let tx = x + padding;
    let ty = y + padding;

    // Flip to other side if overflowing screen
    if (tx + tooltipReact.width > window.innerWidth) {
      tx = x - tooltipReact.width - padding;
    }
    if (ty + tooltipReact.height > window.innerHeight) {
      ty = y - tooltipReact.height - padding;
    }

    tooltipRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  }, [mousePos, blueprint]);

  const diagnosticHex = useMemo(() => {
    if (!nodeMeta) return '000';
    const source = `${nodeMeta.tagName}${nodeMeta.width}${nodeMeta.height}`;
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) | 0;
    }
    return Math.abs(hash % 0xfff).toString(16).toUpperCase().padStart(3, '0');
  }, [nodeMeta]);

  if (!blueprint) return null;

  return (
    <>
      {/* 1. DOM INSPECTOR OUTLINE GLOW OVERLAY */}
      {nodeMeta && (
        <div
          id="blueprint-overlay-box"
          className="fixed pointer-events-none z-[140] transition-all duration-75 ease-out"
          style={{
            top: nodeMeta.top,
            left: nodeMeta.left,
            width: nodeMeta.width,
            height: nodeMeta.height,
            border: '1px solid #c4ff0e',
            backgroundColor: 'rgba(196, 255, 14, 0.1)',
            boxShadow: '0 0 15px rgba(196, 255, 14, 0.2) inset, 0 0 15px rgba(196, 255, 14, 0.2)',
          }}
        >
          {/* Dimension badge floating top-right of overlay */}
          <div className="absolute -top-5 right-0 bg-[#c4ff0e] text-black text-[9px] font-mono font-bold px-1 rounded-sm tracking-wider">
            {nodeMeta.width}x{nodeMeta.height}
          </div>
        </div>
      )}

      {/* 2. THE FLOATING FLOATING METADATA HUD */}
      {nodeMeta && (
        <div
          id="blueprint-inspector"
          ref={tooltipRef}
          className="fixed top-0 left-0 z-[150] pointer-events-none p-4 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-accent/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(196,255,14,0.15)] font-mono text-[9px] min-w-[260px] max-w-[320px]"
          style={{ willChange: 'transform' }}
        >
          <div className="absolute inset-0 bg-accent/5 opacity-20 pointer-events-none overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(196,255,14,0.05)_25%,rgba(196,255,14,0.05)_26%,transparent_27%,transparent_74%,rgba(196,255,14,0.05)_75%,rgba(196,255,14,0.05)_76%,transparent_77%)] bg-[length:100%_4px]" />
          </div>

          <div className="relative">
            {/* Header / Selector */}
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-accent/20 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="text-accent font-bold uppercase tracking-widest text-[10px]">
                  &lt;{nodeMeta.tagName}&gt;
                </span>
                {nodeMeta.id && <span className="text-pink-400 font-medium">{nodeMeta.id}</span>}
              </div>
              <span className="text-zinc-600 font-bold">{nodeMeta.width} × {nodeMeta.height}</span>
            </div>

            {nodeMeta.className && (
              <div className="text-[#a78bfa] mb-3 leading-relaxed break-all font-medium">
                {nodeMeta.className}
              </div>
            )}

            {/* Custom Component Meta Overrides (if exists) */}
            {hoverMeta && (
              <div className="mb-3 p-2 bg-accent/10 border border-accent/20 rounded-md">
                 <div className="flex items-center gap-1.5 text-accent mb-1 uppercase tracking-wider text-[8px] font-bold">
                    <Activity size={10} /> Component Context
                 </div>
                 <div className="text-zinc-300">React Node: <span className="text-white font-bold">{hoverMeta.name}</span></div>
                 <div className="text-zinc-400 truncate">Props: {hoverMeta.props}</div>
              </div>
            )}

            {/* CSS Properties Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 uppercase text-[7px] flex items-center gap-1"><Box size={8}/> Display</span>
                <span className="text-zinc-200">{nodeMeta.display}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 uppercase text-[7px] flex items-center gap-1"><Layers size={8}/> Position</span>
                <span className="text-zinc-200">{nodeMeta.position}</span>
              </div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 uppercase text-[7px]">Padding</span>
                <span className="text-emerald-400">{nodeMeta.padding || '0'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 uppercase text-[7px]">Margin</span>
                <span className="text-orange-400">{nodeMeta.margin || '0'}</span>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-white/5 pt-2 mb-2">
               <div className="flex items-center justify-between">
                 <span className="text-zinc-500 uppercase text-[7px] flex items-center gap-1"><Type size={8}/> Typography</span>
                 <span className="text-zinc-300 max-w-[120px] truncate bg-white/5 px-1 py-0.5 rounded">{nodeMeta.fontFamily}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-zinc-500 uppercase text-[7px] flex items-center gap-1"><PaintBucket size={8}/> Color</span>
                 <div className="flex items-center gap-1">
                   <div className="w-2 h-2 rounded-sm border border-white/20" style={{ backgroundColor: nodeMeta.color }} />
                   <span className="text-zinc-300">{nodeMeta.color.replace('rgb', '')}</span>
                 </div>
               </div>
            </div>

            <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[7px] text-accent/60 uppercase">
                <Tag size={8} />
                <span>Node_ID</span>
              </div>
              <span className="text-[7px] text-zinc-700">0x{diagnosticHex}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlueprintMetadata;
