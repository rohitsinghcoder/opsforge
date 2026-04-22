/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';

export interface ComponentMeta {
  name: string;
  bounds: string;
  props: string;
  targetX?: number;
  targetY?: number;
}

interface BlueprintContextType {
  blueprint: boolean;
  setBlueprint: (b: boolean) => void;
  hoverMeta: ComponentMeta | null;
  setHoverMeta: (m: ComponentMeta | null) => void;
}

const BlueprintContext = createContext<BlueprintContextType | null>(null);

export const useBlueprintContext = () => {
  const context = useContext(BlueprintContext);
  if (!context) {
    throw new Error('useBlueprintContext must be used within a BlueprintProvider');
  }
  return context;
};

interface BlueprintProviderProps {
  children: ReactNode;
}

export const BlueprintProvider = ({ children }: BlueprintProviderProps) => {
  const [blueprint, setBlueprint] = useState(false);
  const [hoverMeta, setHoverMeta] = useState<ComponentMeta | null>(null);

  return (
    <BlueprintContext.Provider value={{ blueprint, setBlueprint, hoverMeta, setHoverMeta }}>
      {children}
    </BlueprintContext.Provider>
  );
};

export { BlueprintContext };
export default BlueprintContext;
