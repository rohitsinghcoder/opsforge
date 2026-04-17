import { useRef, useEffect, useCallback } from 'react';

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const isHoveringRef = useRef(false);

  const updateCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return;
    const scale = isHoveringRef.current ? 2.5 : 1;
    const bg = isHoveringRef.current ? 'rgba(196, 255, 14, 0.2)' : 'transparent';
    cursorRef.current.style.transform = `translate3d(${x - 16}px, ${y - 16}px, 0) scale(${scale})`;
    cursorRef.current.style.backgroundColor = bg;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => updateCursor(e.clientX, e.clientY);
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      isHoveringRef.current = !!(
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('.hover-trigger')
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [updateCursor]);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-accent pointer-events-none z-[100] hidden md:block transition-[background-color] duration-200"
      style={{ willChange: 'transform' }}
    />
  );
};

export default CustomCursor;
