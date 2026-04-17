import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getOrCreateClientId } from '../utils/clientIdentity';

interface UseSystemBreachOptions {
  onResolved?: () => void;
}

export function useSystemBreach({ onResolved }: UseSystemBreachOptions = {}) {
  const [isBreached, setIsBreached] = useState(false);
  const [breachStep, setBreachStep] = useState(0);
  const [breachInput, setBreachInput] = useState('');
  const [clientId] = useState(() => getOrCreateClientId());
  const logEvent = useMutation(api.logs.logEvent);
  const advanceTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const triggerBreach = useCallback(() => {
    clearTimers();
    setIsBreached(true);
    setBreachStep(1);
    setBreachInput('');
    void logEvent({
      type: 'BREACH',
      user: 'GUEST_TERMINAL',
      content: 'System override sequence initiated',
      clientId,
    });
    advanceTimerRef.current = window.setTimeout(() => {
      setBreachStep(2);
      advanceTimerRef.current = null;
    }, 2000);
  }, [clearTimers, clientId, logEvent]);

  const handleBreachInput = useCallback((nextInput: string) => {
    setBreachInput(nextInput);

    if (breachStep !== 2 || nextInput.trim().toUpperCase() !== 'STATUS_RESYNC') {
      return;
    }

    clearTimers();
    setBreachStep(3);
    onResolved?.();
    resetTimerRef.current = window.setTimeout(() => {
      setIsBreached(false);
      setBreachStep(0);
      setBreachInput('');
      resetTimerRef.current = null;
    }, 1500);
  }, [breachStep, clearTimers, onResolved]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    isBreached,
    breachStep,
    breachInput,
    setBreachInput: handleBreachInput,
    triggerBreach,
    breachResolved: breachStep === 3,
  };
}
