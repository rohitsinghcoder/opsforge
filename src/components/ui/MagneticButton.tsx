import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useBlueprintContext } from '../../contexts/BlueprintContext';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const MagneticButton = ({ children, onClick }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { setHoverMeta } = useBlueprintContext();

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current!.getBoundingClientRect();
    setPosition({ x: (clientX - (left + width / 2)) * 0.3, y: (clientY - (top + height / 2)) * 0.3 });
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        const bounds = ref.current?.getBoundingClientRect();
        if (bounds) {
          setHoverMeta({
            name: "<MagneticButton />",
            bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
            props: "spring(150, 15, 0.1)",
            targetX: bounds.left + bounds.width / 2,
            targetY: bounds.top + bounds.height / 2
          });
        }
      }}
      onMouseLeave={() => {
        setPosition({ x: 0, y: 0 });
        setHoverMeta(null);
      }}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

export default MagneticButton;
