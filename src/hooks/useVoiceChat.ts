import { useState, useCallback, useRef } from 'react';
import { askEcho } from '../services/ai';
import {
  listenForSpeech,
  speak,
  stopSpeaking,
  isSpeechRecognitionSupported,
} from '../services/voice';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export function useVoiceChat(
  chatHistory: any[],
  onExchangeComplete?: (userText: string, aiResponse: string) => void
) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const abortedRef = useRef(false);

  const isSupported = isSpeechRecognitionSupported();

  const stopVoiceChat = useCallback(() => {
    abortedRef.current = true;
    if (stopRef.current) { stopRef.current(); stopRef.current = null; }
    stopSpeaking();
    setVoiceState('idle');
  }, []);

  const startVoiceChat = useCallback(async () => {
    // Toggle off if already active
    if (voiceState !== 'idle') { stopVoiceChat(); return; }

    abortedRef.current = false;
    setError(null);
    setTranscript('');
    setVoiceResponse('');

    try {
      // Step 1: Listen
      setVoiceState('listening');
      const { promise, stop } = listenForSpeech((interim) => setTranscript(interim));
      stopRef.current = stop;

      const spokenText = await promise;
      stopRef.current = null;
      if (abortedRef.current || !spokenText.trim()) { setVoiceState('idle'); return; }
      setTranscript(spokenText);

      // Step 2: Process with Gemini
      setVoiceState('processing');
      const aiResponse = await askEcho(spokenText, chatHistory);
      if (abortedRef.current) return;

      setVoiceResponse(aiResponse);
      onExchangeComplete?.(spokenText, aiResponse);

      // Step 3: Speak response
      setVoiceState('speaking');
      await speak(aiResponse);
      if (abortedRef.current) return;

      setVoiceState('idle');
    } catch (err) {
      if (abortedRef.current) return;
      console.error('Voice chat error:', err);
      setError(err instanceof Error ? err.message : 'Voice chat failed');
      setVoiceState('error');
      setTimeout(() => { setVoiceState('idle'); setError(null); }, 3000);
    }
  }, [voiceState, chatHistory, stopVoiceChat, onExchangeComplete]);

  return { voiceState, transcript, voiceResponse, error, startVoiceChat, stopVoiceChat, isSupported };
}

export default useVoiceChat;
