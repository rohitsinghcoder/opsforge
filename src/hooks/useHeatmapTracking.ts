import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useSessionHeatmap } from '../contexts/SessionHeatmapContext';
import { getOrCreateSessionId } from '../utils/clientIdentity';

interface BufferedMoveInteraction {
  sessionId: string;
  path: string;
  type: 'move';
  x: number;
  y: number;
  timestamp: number;
}

const MOVE_THROTTLE_MS = 1000;
const MIN_DISTANCE = 10;
const BATCH_FLUSH_SIZE = 20;
const FLUSH_DELAY_MS = 1500;

export const useHeatmapTracking = (pathname: string) => {
  const { addInteraction, addClick } = useSessionHeatmap();
  const storeBatch = useMutation(api.heatmap.storeBatch);
  const storeClick = useMutation(api.heatmap.storeClick);
  const [sessionId] = useState(() => getOrCreateSessionId());
  const batchRef = useRef<BufferedMoveInteraction[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const isFlushingRef = useRef(false);
  const sessionLimitReachedRef = useRef(false);

  const scheduleFlush = useCallback((flushBatch: () => Promise<void>) => {
    if (flushTimerRef.current !== null || batchRef.current.length === 0 || sessionLimitReachedRef.current) {
      return;
    }

    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      void flushBatch();
    }, FLUSH_DELAY_MS);
  }, []);

  const flushBatch = useCallback(async () => {
    if (isFlushingRef.current || sessionLimitReachedRef.current || batchRef.current.length === 0) {
      return;
    }

    isFlushingRef.current = true;
    const interactions = batchRef.current.slice(0, BATCH_FLUSH_SIZE);
    batchRef.current = batchRef.current.slice(interactions.length);

    try {
      const result = await storeBatch({ interactions });
      if (result.reason === 'session_limit_reached') {
        sessionLimitReachedRef.current = true;
        batchRef.current = [];
      }
    } catch (error) {
      console.error('Failed to persist heatmap batch:', error);
      batchRef.current = [...interactions, ...batchRef.current];
    } finally {
      isFlushingRef.current = false;
      scheduleFlush(flushBatch);
    }
  }, [scheduleFlush, storeBatch]);

  useEffect(() => {
    let lastMoveTime = 0;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < MOVE_THROTTLE_MS) return;

      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
      if (distance < MIN_DISTANCE && lastX !== 0) return;

      lastMoveTime = now;
      lastX = x;
      lastY = y;

      const interaction: BufferedMoveInteraction = {
        sessionId,
        path: pathname,
        type: 'move',
        x,
        y,
        timestamp: now,
      };

      addInteraction(interaction);
      if (sessionLimitReachedRef.current) return;

      batchRef.current.push(interaction);
      if (batchRef.current.length >= BATCH_FLUSH_SIZE) {
        void flushBatch();
      } else {
        scheduleFlush(flushBatch);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      addClick(sessionId, pathname, x, y);
      if (sessionLimitReachedRef.current) return;

      void storeClick({ sessionId, path: pathname, x, y })
        .then((result) => {
          if (!result.stored && result.reason === 'session_limit_reached') {
            sessionLimitReachedRef.current = true;
          }
        })
        .catch((error) => {
          console.error('Failed to persist heatmap click:', error);
        });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        void flushBatch();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      void flushBatch();
    };
  }, [addClick, addInteraction, flushBatch, pathname, scheduleFlush, sessionId, storeClick]);

  return { sessionId };
};

export default useHeatmapTracking;
