import { useState, useCallback, useRef, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  listenForSpeech,
  playGeneratedAudio,
  speakWithBrowserTTS,
  stopSpeaking,
  isSpeechRecognitionSupported,
} from '../services/voice';
import { getOrCreateClientId } from '../utils/clientIdentity';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export function useVoiceChat(
  chatHistory: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>,
  onExchangeComplete?: (userText: string, aiResponse: string) => void
) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [clientId] = useState(() => getOrCreateClientId());
  const stopRef = useRef<(() => void) | null>(null);
  const abortedRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);

  const isSupported = isSpeechRecognitionSupported();
  const askEcho = useAction(api.ai.askEcho);
  const synthesizeSpeech = useAction(api.ai.synthesizeSpeech);

  const stopVoiceChat = useCallback(() => {
    abortedRef.current = true;
    if (stopRef.current) { stopRef.current(); stopRef.current = null; }
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    stopSpeaking();
    setVoiceState('idle');
  }, []);

  useEffect(() => stopVoiceChat, [stopVoiceChat]);

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
      const aiResponse = await askEcho({
        query: spokenText,
        history: chatHistory,
        clientId,
      });
      if (abortedRef.current) return;

      setVoiceResponse(aiResponse);
      onExchangeComplete?.(spokenText, aiResponse);

      // Step 3: Speak response
      setVoiceState('speaking');
      const generatedAudio = await synthesizeSpeech({
        text: aiResponse,
        clientId,
      });

      if (abortedRef.current) return;

      if (generatedAudio) {
        await playGeneratedAudio(generatedAudio.audioBase64, generatedAudio.mimeType);
      } else {
        await speakWithBrowserTTS(aiResponse);
      }

      if (abortedRef.current) return;

      setVoiceState('idle');
    } catch (err) {
      if (abortedRef.current) return;
      console.error('Voice chat error:', err);
      setError(err instanceof Error ? err.message : 'Voice chat failed');
      setVoiceState('error');
      resetTimerRef.current = window.setTimeout(() => {
        setVoiceState('idle');
        setError(null);
        resetTimerRef.current = null;
      }, 3000);
    }
  }, [askEcho, chatHistory, clientId, onExchangeComplete, stopVoiceChat, synthesizeSpeech, voiceState]);

  return { voiceState, transcript, voiceResponse, error, startVoiceChat, stopVoiceChat, isSupported };
}

export default useVoiceChat;
