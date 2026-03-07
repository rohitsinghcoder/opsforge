/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react';

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
  value: BlueprintContextType;
}

export const BlueprintProvider = ({ children, value }: BlueprintProviderProps) => {
  return (
    <BlueprintContext.Provider value={value}>
      {children}
    </BlueprintContext.Provider>
  );
};

export { BlueprintContext };
export default BlueprintContext;
