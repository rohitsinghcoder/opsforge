import { useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getOrCreateClientId } from '../utils/clientIdentity';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

interface UsePlaygroundAIProps {
  systemRules: string;
  initialFiles: Record<string, string>;
}

function extractCode(raw: string): string | null {
  if (!raw || !raw.trim()) return null;

  const fenceMatch = raw.match(/```(?:jsx?|tsx?|javascript|typescript)?\s*\n([\s\S]*?)\n?\s*```/);
  if (fenceMatch?.[1]?.trim()) {
    return fenceMatch[1].trim();
  }

  const trimmed = raw.trim();
  if (/^import\s/.test(trimmed) || /^export\s/.test(trimmed) || /^(?:\/\/|\/\*)/.test(trimmed)) {
    return trimmed.replace(/\n?```\s*$/, '').trim();
  }

  const importMatch = trimmed.match(/(import\s[\s\S]*)/);
  if (importMatch?.[1]) {
    return importMatch[1].replace(/\n?```\s*$/, '').trim();
  }

  return null;
}

function isValidComponent(code: string): boolean {
  const hasExport = /export\s+default/.test(code);
  const hasJSX = /<\w/.test(code);
  const hasReturn = /return\s*\(/.test(code) || /return\s*</.test(code);
  return hasExport && (hasJSX || hasReturn);
}

export function usePlaygroundAI({ systemRules, initialFiles }: UsePlaygroundAIProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [clientId] = useState(() => getOrCreateClientId());
  const [customFiles, setCustomFiles] = useState<Record<string, string>>(initialFiles);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const lastKnownGoodCodeRef = useRef(initialFiles['/App.js'] ?? '');
  const generatePlaygroundCode = useAction(api.ai.generatePlaygroundCode);

  const callAi = async (prompt: string, isModification: boolean): Promise<string | null> => {
    const result = await generatePlaygroundCode({
      prompt,
      currentCode: isModification ? customFiles['/App.js'] : undefined,
      systemRules,
      clientId,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    const rawText = result.text || '';
    const code = extractCode(rawText);

    if (!code) return null;
    if (!isValidComponent(code)) return null;

    return code;
  };

  const applyCodeUpdate = (code: string | null, onGenerateCallback?: () => void) => {
    if (code) {
      lastKnownGoodCodeRef.current = code;
      setCustomFiles(prev => ({ ...prev, '/App.js': code }));
      if (onGenerateCallback) onGenerateCallback();
      return true;
    } else {
      setCustomFiles(prev => ({ ...prev, '/App.js': lastKnownGoodCodeRef.current || prev['/App.js'] }));
      return false;
    }
  };

  const executeAiAction = async (prompt: string, isModification: boolean, onGenerateCallback?: () => void) => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const code = await callAi(prompt, isModification);
      const success = applyCodeUpdate(code, onGenerateCallback);
      const errorMessage = 'AI returned invalid code. Your previous working version is still loaded.';
      
      if (!success) {
        setAiError(errorMessage);
        if (isModification) setChatMessages(prev => [...prev, { role: 'ai', text: errorMessage }]);
      } else if (isModification) {
        setChatMessages(prev => [...prev, { role: 'ai', text: 'Code updated.' }]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI generation failed. Please try again.';
      setAiError(message);
      if (isModification) setChatMessages(prev => [...prev, { role: 'ai', text: message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateFromPrompt = async (prompt: string, onGenerateCallback?: () => void) => {
    setActivePrompt(prompt);
    await executeAiAction(prompt, false, onGenerateCallback);
    setActivePrompt(null);
  };

  const handleChatSubmit = async (e: React.FormEvent, onGenerateCallback?: () => void) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || isAiLoading) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    await executeAiAction(msg, true, onGenerateCallback);
  };

  const clearChat = () => {
    setChatMessages([]);
    setAiError(null);
  };

  return {
    isAiLoading,
    activePrompt,
    customFiles,
    setCustomFiles,
    chatInput,
    setChatInput,
    chatMessages,
    aiError,
    handleChatSubmit,
    generateFromPrompt,
    clearChat
  };
}
