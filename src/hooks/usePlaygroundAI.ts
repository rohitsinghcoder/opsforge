import { useState } from 'react';
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

  const generateFromPrompt = async (prompt: string, onGenerateCallback?: () => void) => {
    setIsAiLoading(true);
    setActivePrompt(prompt);
    try {
      const code = await callAi(prompt, false);
      if (code) {
        setCustomFiles(prev => ({ ...prev, '/App.js': code }));
        if (onGenerateCallback) onGenerateCallback();
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsAiLoading(false);
      setActivePrompt(null);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent, onGenerateCallback?: () => void) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || isAiLoading) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsAiLoading(true);

    try {
      const code = await callAi(msg, true);
      if (code) {
        setCustomFiles(prev => ({ ...prev, '/App.js': code }));
        if (onGenerateCallback) onGenerateCallback();
        setChatMessages(prev => [...prev, { role: 'ai', text: 'Code updated.' }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: 'AI returned invalid code. Try rephrasing your request.' }]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error. Try again.';
      setChatMessages(prev => [...prev, { role: 'ai', text: message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearChat = () => setChatMessages([]);

  return {
    isAiLoading,
    activePrompt,
    customFiles,
    setCustomFiles,
    chatInput,
    setChatInput,
    chatMessages,
    handleChatSubmit,
    generateFromPrompt,
    clearChat
  };
}
