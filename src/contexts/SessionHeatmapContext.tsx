/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useRef, useCallback, useMemo, type ReactNode } from 'react';

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
  subscribe: (path: string, callback: () => void) => () => void;
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
  // Store interactions in memory only - cleared on page refresh.
  // Refs keep high-frequency telemetry off the app-wide render path.
  const interactionsByPathRef = useRef<Map<string, Interaction[]>>(new Map());
  const listenersRef = useRef<Map<string, Set<() => void>>>(new Map());

  const subscribe = useCallback((path: string, callback: () => void) => {
    if (!listenersRef.current.has(path)) {
      listenersRef.current.set(path, new Set());
    }
    listenersRef.current.get(path)!.add(callback);
    return () => {
      listenersRef.current.get(path)?.delete(callback);
    };
  }, []);

  const addInteraction = useCallback((interaction: Interaction) => {
    const pathInteractions = interactionsByPathRef.current.get(interaction.path) || [];

    // Keep only last 100 interactions per path to prevent memory bloat
    const updated = [...pathInteractions, interaction].slice(-100);
    interactionsByPathRef.current.set(interaction.path, updated);

    listenersRef.current.get(interaction.path)?.forEach(cb => cb());
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
    const interactions = interactionsByPathRef.current.get(path) || [];
    
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
  }, []);

  const clearData = useCallback(() => {
    interactionsByPathRef.current = new Map();
  }, []);

  const value = useMemo(
    () => ({ addInteraction, addClick, getHeatmapData, clearData, subscribe }),
    [addInteraction, addClick, getHeatmapData, clearData, subscribe]
  );

  return (
    <SessionHeatmapContext.Provider value={value}>
      {children}
    </SessionHeatmapContext.Provider>
  );
};

export default SessionHeatmapContext;
