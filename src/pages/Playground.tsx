import { useState, useRef, useEffect } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Sparkles, Loader2, Copy, Check, Send, Zap } from 'lucide-react';
import { useBlueprintContext } from '../contexts/BlueprintContext';

const STARTER_CODE = `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050505',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em' }}>
        Echo Playground
      </h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>
        Start building something amazing
      </p>
      <button
        onClick={() => setCount(c => c + 1)}
        style={{
          background: '#c4ff0e',
          color: '#000',
          border: 'none',
          padding: '12px 32px',
          fontSize: '1rem',
          fontWeight: 900,
          borderRadius: '999px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        Clicked {count} times
      </button>
    </div>
  );
}`;

const AI_PROMPTS = [
  'Add a dark glassmorphism card with a gradient border',
  'Create an animated loading spinner',
  'Build a mini calculator',
  'Make a color palette generator',
  'Add a typing animation effect',
];

const SYSTEM_RULES = `RULES:
- Export default the component
- Always add "import { useState, useEffect, useRef } from 'react';" at the top if you use any hooks
- Use inline styles only (no CSS imports)
- Use a dark theme (background #050505, text white, accent #c4ff0e)
- Make it visually impressive with smooth transitions
- Keep it in a single file
- Return ONLY the raw JavaScript code, no markdown, no code fences, no explanation

Example format:
import { useState } from 'react';

export default function App() {
  const [x, setX] = useState(0);
  return <div>Hello</div>;
}`;

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const Playground = () => {
  const { blueprint } = useBlueprintContext();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [customFiles, setCustomFiles] = useState<Record<string, string>>({
    '/App.js': STARTER_CODE,
  });
  const [resetKey, setResetKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // Responsive editor height
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // AI Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const callAi = async (prompt: string, isModification: boolean): Promise<string | null> => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) return null;

    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: API_KEY });

    const fullPrompt = isModification
      ? `You are a React component editor. Here is the current code:\n\n\`\`\`jsx\n${customFiles['/App.js']}\n\`\`\`\n\nThe user wants you to: ${prompt}\n\n${SYSTEM_RULES}`
      : `You are a React component generator. Generate a single React component that: ${prompt}\n\n${SYSTEM_RULES}`;

    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: { temperature: 0.8 },
    });

    let code = result.text || '';
    if (code.startsWith('```')) {
      code = code.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\n?/, '').replace(/\n?```$/, '');
    }
    return code.trim();
  };

  const handleAiGenerate = async (prompt: string) => {
    setIsAiLoading(true);
    setActivePrompt(prompt);
    try {
      const code = await callAi(prompt, false);
      if (code) {
        setCustomFiles({ '/App.js': code });
        setResetKey(k => k + 1);
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsAiLoading(false);
      setActivePrompt(null);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || isAiLoading) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsAiLoading(true);

    try {
      const code = await callAi(msg, true);
      if (code) {
        setCustomFiles({ '/App.js': code });
        setResetKey(k => k + 1);
        setChatMessages(prev => [...prev, { role: 'ai', text: '✓ Code updated' }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: '✗ Failed to generate code' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: '✗ Error — try again' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReset = () => {
    setCustomFiles({ '/App.js': STARTER_CODE });
    setResetKey(k => k + 1);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(customFiles['/App.js']);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="pt-32 md:pt-40 pb-24 px-4 md:px-6 min-h-screen">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Play size={14} className="text-accent" />
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.3em]">
              Interactive_Sandbox
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
            Play<span className="text-outline">ground</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm max-w-xl">
            Write React code and see it render live. Use the AI chat below the editor to modify your code with natural language.
          </p>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6"
        >
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent transition-all"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent transition-all"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />

          {/* AI Quick Prompts — horizontally scrollable on mobile */}
          <div className="w-full md:w-auto overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2 w-max md:flex-wrap md:w-auto">
              {AI_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleAiGenerate(prompt)}
                  disabled={isAiLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all whitespace-nowrap ${
                    activePrompt === prompt
                      ? 'bg-accent text-black'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-accent'
                  } ${isAiLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {activePrompt === prompt ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  {isMobile && prompt.length > 25 ? prompt.substring(0, 25) + '…' : prompt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* AI Loading Banner */}
        <AnimatePresence>
          {isAiLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 px-4 py-3 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3"
            >
              <Loader2 size={14} className="text-accent animate-spin" />
              <span className="font-mono text-xs text-accent">
                Echo-1 is generating your component...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sandpack Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden border border-white/10"
        >
          <Sandpack
            key={resetKey}
            template="react"
            theme={{
              colors: {
                surface1: '#0a0a0a',
                surface2: '#111111',
                surface3: '#1a1a1a',
                clickable: '#999999',
                base: '#808080',
                disabled: '#4D4D4D',
                hover: '#c4ff0e',
                accent: '#c4ff0e',
                error: '#ff453a',
                errorSurface: '#1a0000',
              },
              syntax: {
                plain: '#e0e0e0',
                comment: { color: '#555', fontStyle: 'italic' },
                keyword: '#c4ff0e',
                tag: '#7ee787',
                punctuation: '#888',
                definition: '#d2a8ff',
                property: '#79c0ff',
                static: '#ffa657',
                string: '#a5d6ff',
              },
              font: {
                body: '-apple-system, Inter, sans-serif',
                mono: '"JetBrains Mono", "Fira Code", monospace',
                size: '13px',
                lineHeight: '1.6',
              },
            }}
            files={customFiles}
            options={{
              showTabs: true,
              showLineNumbers: !isMobile,
              showInlineErrors: true,
              editorHeight: isMobile ? 300 : 500,
              classes: {
                'sp-wrapper': 'custom-sandpack',
              },
            }}
          />
        </motion.div>

        {/* AI Chat Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-accent" />
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Echo-1 Code Assistant
              </span>
            </div>
            {chatMessages.length > 0 && (
              <button
                onClick={() => setChatMessages([])}
                className="font-mono text-[8px] text-zinc-600 uppercase hover:text-red-400 transition-colors"
              >
                [ Clear ]
              </button>
            )}
          </div>

          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="max-h-36 md:max-h-48 overflow-y-auto px-4 md:px-5 py-3 space-y-2 no-scrollbar">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`font-mono text-xs py-1 px-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'text-accent bg-accent/5 border-l-2 border-accent/30'
                      : 'text-zinc-400 bg-white/5 border-l-2 border-zinc-700'
                  }`}
                >
                  <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-0.5">
                    {msg.role === 'user' ? 'You:' : 'Echo-1:'}
                  </span>
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-3 border-t border-white/5">
            <Sparkles size={14} className="text-accent/50 shrink-0 hidden md:block" />
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={isMobile ? "Describe a change..." : "Describe a change... e.g. 'add a dark mode toggle' or 'make the button bigger'"}
              className="flex-1 bg-transparent border-none outline-none font-mono text-xs md:text-sm text-accent placeholder:text-zinc-600 min-w-0"
              disabled={isAiLoading}
            />
            <button
              type="submit"
              disabled={isAiLoading || !chatInput.trim()}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                isAiLoading || !chatInput.trim()
                  ? 'border-white/5 text-zinc-700'
                  : 'border-accent/30 text-accent hover:bg-accent hover:text-black'
              }`}
            >
              {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </motion.div>

        {/* Footer hint */}
        <div className="mt-6 flex items-center justify-between">
          <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
            {blueprint ? 'SANDBOX_ENV: DEBUG_ACTIVE' : 'Powered by Sandpack + Echo-1'}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
              Live_Preview
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
