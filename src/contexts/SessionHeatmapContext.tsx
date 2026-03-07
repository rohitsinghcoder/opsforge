/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Interaction {
  sessionId: string;
  path: string;
  type: string;
  x: number;
  y: number;
  timestamp: number;
}

interface HeatmapData {
  grid: number[][];
  maxValue: number;
  clicks: { x: number; y: number }[];
  totalInteractions: number;
  totalClicks: number;
  totalMoves: number;
}

interface SessionHeatmapContextType {
  addInteraction: (interaction: Interaction) => void;
  addClick: (sessionId: string, path: string, x: number, y: number) => void;
  getHeatmapData: (path: string) => HeatmapData;
  clearData: () => void;
}

const GRID_SIZE = 10;

const createEmptyGrid = (): number[][] => 
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

const SessionHeatmapContext = createContext<SessionHeatmapContextType | null>(null);

const useSessionHeatmap = () => {
  const context = useContext(SessionHeatmapContext);
  if (!context) {
    throw new Error('useSessionHeatmap must be used within a SessionHeatmapProvider');
  }
  return context;
};

export { useSessionHeatmap };

interface SessionHeatmapProviderProps {
  children: ReactNode;
}

export const SessionHeatmapProvider = ({ children }: SessionHeatmapProviderProps) => {
  // Store interactions in memory only - cleared on page refresh
  const [interactionsByPath, setInteractionsByPath] = useState<Map<string, Interaction[]>>(new Map());

  const addInteraction = useCallback((interaction: Interaction) => {
    setInteractionsByPath(prev => {
      const newMap = new Map(prev);
      const pathInteractions = newMap.get(interaction.path) || [];
      
      // Keep only last 100 interactions per path to prevent memory bloat
      const updated = [...pathInteractions, interaction].slice(-100);
      newMap.set(interaction.path, updated);
      
      return newMap;
    });
  }, []);

  const addClick = useCallback((sessionId: string, path: string, x: number, y: number) => {
    addInteraction({
      sessionId,
      path,
      type: 'click',
      x,
      y,
      timestamp: Date.now(),
    });
  }, [addInteraction]);

  const getHeatmapData = useCallback((path: string): HeatmapData => {
    const interactions = interactionsByPath.get(path) || [];
    
    const grid = createEmptyGrid();
    const clicks: { x: number; y: number }[] = [];
    let totalClicks = 0;
    let totalMoves = 0;

    for (const interaction of interactions) {
      const gridX = Math.min(Math.floor(interaction.x / GRID_SIZE), GRID_SIZE - 1);
      const gridY = Math.min(Math.floor(interaction.y / GRID_SIZE), GRID_SIZE - 1);
      
      // Ensure valid indices
      if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
        if (interaction.type === 'click') {
          grid[gridY][gridX] += 10;
          clicks.push({ x: interaction.x, y: interaction.y });
          totalClicks++;
        } else {
          grid[gridY][gridX] += 1;
          totalMoves++;
        }
      }
    }

    const maxValue = Math.max(...grid.flat(), 1);

    return {
      grid,
      maxValue,
      clicks: clicks.slice(-50), // Only return last 50 clicks
      totalInteractions: interactions.length,
      totalClicks,
      totalMoves,
    };
  }, [interactionsByPath]);

  const clearData = useCallback(() => {
    setInteractionsByPath(new Map());
  }, []);

  return (
    <SessionHeatmapContext.Provider value={{ addInteraction, addClick, getHeatmapData, clearData }}>
      {children}
    </SessionHeatmapContext.Provider>
  );
};

export default SessionHeatmapContext;
