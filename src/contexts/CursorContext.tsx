import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type CursorVariant = 'default' | 'button' | 'play' | 'text' | 'wrap';

interface CursorState {
  variant: CursorVariant;
  text?: string;
  targetRect?: DOMRect | null;
}

interface CursorContextType {
  cursorState: CursorState;
  setCursorState: (state: Partial<CursorState>) => void;
  resetCursor: () => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const CursorProvider = ({ children }: { children: ReactNode }) => {
  const [cursorState, setCursorStateInternal] = useState<CursorState>({
    variant: 'default',
    targetRect: null,
  });

  const setCursorState = (state: Partial<CursorState>) => {
    setCursorStateInternal((prev) => ({ ...prev, ...state }));
  };

  const resetCursor = () => {
    setCursorStateInternal({ variant: 'default', text: undefined, targetRect: null });
  };

  return (
    <CursorContext.Provider value={{ cursorState, setCursorState, resetCursor }}>
      {children}
    </CursorContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};
