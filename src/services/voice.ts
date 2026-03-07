/* eslint-disable @typescript-eslint/no-explicit-any */

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

let currentAudio: HTMLAudioElement | null = null;

export async function playGeneratedAudio(
  audioBase64: string,
  mimeType = 'audio/mpeg'
): Promise<void> {
  stopSpeaking();

  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; reject(new Error('Playback failed')); };
    audio.play().catch(reject);
  });
}

export function speakWithBrowserTTS(text: string): Promise<void> {
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
