/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Browser Speech Recognition type shim ───
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isElevenLabsConfigured(): boolean {
  return !!import.meta.env.VITE_ELEVENLABS_API_KEY;
}

/**
 * Listen for speech via Web Speech API.
 * Returns a promise resolving to the transcript, and a stop() handle.
 */
export function listenForSpeech(
  onInterim?: (text: string) => void
): { promise: Promise<string>; stop: () => void } {
  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return {
      promise: Promise.reject(new Error('Speech recognition not supported')),
      stop: () => {},
    };
  }

  const recognition = new SpeechRecognitionClass();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let resolved = false;
  let lastInterim = '';

  const promise = new Promise<string>((resolve, reject) => {
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          resolved = true;
          resolve(event.results[i][0].transcript);
          return;
        }
        lastInterim = event.results[i][0].transcript;
      }
      onInterim?.(lastInterim);
    };

    recognition.onerror = (event: any) => {
      if (!resolved) {
        resolved = true;
        if (event.error === 'no-speech') {
          resolve('');
        } else {
          reject(new Error(`Speech recognition error: ${event.error}`));
        }
      }
    };

    recognition.onend = () => {
      if (!resolved) {
        resolved = true;
        resolve(lastInterim);
      }
    };
  });

  recognition.start();

  return {
    promise,
    stop: () => { try { recognition.stop(); } catch { /* ignore */ } },
  };
}

// ─── Audio playback ───
let currentAudio: HTMLAudioElement | null = null;

/**
 * Speak text — tries ElevenLabs first, falls back to browser TTS.
 */
export async function speak(text: string): Promise<void> {
  if (isElevenLabsConfigured()) {
    try {
      await speakWithElevenLabs(text);
      return;
    } catch (err) {
      console.warn('ElevenLabs failed, falling back to browser TTS:', err);
    }
  }
  await speakWithBrowserTTS(text);
}

async function speakWithElevenLabs(text: string): Promise<void> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const voiceId = 'JBFqnCBsd6RMkjVDRZzb'; // "George" — deep, authoritative

  stopSpeaking();

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => 'Unknown error');
    throw new Error(`ElevenLabs error (${res.status}): ${body}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; reject(new Error('Playback failed')); };
    audio.play().catch(reject);
  });
}

function speakWithBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 0.85;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
