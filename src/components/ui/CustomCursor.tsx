import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useCursor } from '../../contexts/CursorContext';
import { Play } from 'lucide-react';

export const CustomCursor = () => {
  const { cursorState, setCursorState, resetCursor } = useCursor();
  
  // Instant tracking for the tiny center dot (Zero Lag)
  const exactX = useMotionValue(-100);
  const exactY = useMotionValue(-100);

  // Tighter physics for the outer ring so it feels snappy, not sluggish
  const springConfig = { damping: 35, stiffness: 700, mass: 0.1 };
  const smoothX = useSpring(exactX, springConfig);
  const smoothY = useSpring(exactY, springConfig);

  // Wrap effect tracking
  const wrapX = useMotionValue(0);
  const wrapY = useMotionValue(0);
  const wrapWidth = useMotionValue(0);
  const wrapHeight = useMotionValue(0);
  
  const smoothWrapX = useSpring(wrapX, { damping: 25, stiffness: 400, mass: 0.2 });
  const smoothWrapY = useSpring(wrapY, { damping: 25, stiffness: 400, mass: 0.2 });
  const smoothWrapWidth = useSpring(wrapWidth, { damping: 25, stiffness: 400, mass: 0.2 });
  const smoothWrapHeight = useSpring(wrapHeight, { damping: 25, stiffness: 400, mass: 0.2 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      // Instant instantaneous update
      exactX.set(e.clientX);
      exactY.set(e.clientY);
      
      if (cursorState.variant === 'wrap' && cursorState.targetRect) {
        const rect = cursorState.targetRect;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Stronger magnetic pull
        const pullX = (e.clientX - centerX) * 0.15;
        const pullY = (e.clientY - centerY) * 0.15;
        
        wrapX.set(rect.left - 4 + pullX); // Tighter padding
        wrapY.set(rect.top - 4 + pullY);
        wrapWidth.set(rect.width + 8);
        wrapHeight.set(rect.height + 8);
      }
    };

    window.addEventListener('mousemove', moveCursor);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      const cursorType = target.closest('[data-cursor]')?.getAttribute('data-cursor');
      const wrapTarget = target.closest('[data-cursor-wrap="true"]');
      
      if (wrapTarget) {
        const rect = wrapTarget.getBoundingClientRect();
        setCursorState({ variant: 'wrap', targetRect: rect });
        wrapX.set(rect.left - 4);
        wrapY.set(rect.top - 4);
        wrapWidth.set(rect.width + 8);
        wrapHeight.set(rect.height + 8);
        return;
      }

      if (cursorType === 'play') {
        setCursorState({ variant: 'play' });
        return;
      }

      if (
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a'
      ) {
        setCursorState({ variant: 'button' });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const related = e.relatedTarget as HTMLElement;
      if (related && target.contains(related)) return;
      resetCursor();
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [cursorState.variant, cursorState.targetRect, setCursorState, resetCursor, exactX, exactY, wrapX, wrapY, wrapWidth, wrapHeight]);

  const isWrap = cursorState.variant === 'wrap';
  const isHovered = cursorState.variant !== 'default';

  return (
    <>
      <style>{`
        * { cursor: none !important; }
      `}</style>
      
      {/* 1. INSTANT CORE DOT (Fixes the sluggish/lagging feel) */}
      {!isHovered && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999] w-2 h-2 rounded-full bg-accent"
          style={{
            x: exactX,
            y: exactY,
            translateX: '-50%',
            translateY: '-50%',
            mixBlendMode: 'difference'
          }}
        />
      )}

      {/* 2. TRAILING AURA / SHAPE MORPHER */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] flex items-center justify-center overflow-hidden border border-accent/50"
        style={{
          width: isWrap ? smoothWrapWidth : (cursorState.variant === 'play' ? 64 : 40),
          height: isWrap ? smoothWrapHeight : (cursorState.variant === 'play' ? 64 : 40),
          x: isWrap ? smoothWrapX : smoothX,
          y: isWrap ? smoothWrapY : smoothY,
          translateX: isWrap ? '0%' : '-50%',
          translateY: isWrap ? '0%' : '-50%',
          backgroundColor: cursorState.variant === 'play' ? '#c4ff0e' : 'transparent',
          mixBlendMode: 'difference',
        }}
        initial={false}
        animate={{
          borderRadius: isWrap ? '8px' : '50%',
          scale: cursorState.variant === 'button' ? 1.5 : 1,
          opacity: 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.1 }}
      >
        {cursorState.variant === 'play' && (
          <Play className="text-black ml-1 w-6 h-6" fill="black" />
        )}
      </motion.div>
    </>
  );
};
