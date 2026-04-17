import { useState, useRef, useEffect } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Sparkles, Loader2, Copy, Check, Send, Zap } from 'lucide-react';
import { useBlueprintContext } from '../contexts/BlueprintContext';
import { usePlaygroundAI } from '../hooks/usePlaygroundAI';
import { usePageTitle } from '../hooks/usePageTitle';

import {
  INITIAL_FILES,
  AI_PROMPTS,
  SYSTEM_RULES
} from '../utils/playgroundTemplates';

const Playground = () => {
  usePageTitle('Playground');
  const { blueprint } = useBlueprintContext();
  const [resetKey, setResetKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
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
  } = usePlaygroundAI({
    systemRules: SYSTEM_RULES,
    initialFiles: INITIAL_FILES,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const onGenerateTriggered = () => setResetKey(k => k + 1);

  const handleAiGenerate = (prompt: string) => generateFromPrompt(prompt, onGenerateTriggered);
  const handleFormSubmit = (e: React.FormEvent) => handleChatSubmit(e, onGenerateTriggered);

  const handleReset = () => {
    setCustomFiles(INITIAL_FILES);
    setResetKey(k => k + 1);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (copied) {
      timeoutId = setTimeout(() => setCopied(false), 2000);
    }
    return () => clearTimeout(timeoutId);
  }, [copied]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(customFiles['/App.js']);
      setCopied(true);
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
          className="flex flex-wrap items-center gap-3 mb-6"
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

          {/* AI Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {AI_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleAiGenerate(prompt)}
                disabled={isAiLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all ${
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
                {prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
              </button>
            ))}
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

        <AnimatePresence>
          {aiError && !isAiLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <span className="font-mono text-xs text-red-300">
                {aiError}
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
              showLineNumbers: true,
              showInlineErrors: true,
              editorHeight: 500,
              externalResources: ['https://cdn.tailwindcss.com'],
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
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-accent" />
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Echo-1 Code Assistant
              </span>
            </div>
            {chatMessages.length > 0 && (
              <button
                onClick={clearChat}
                className="font-mono text-[8px] text-zinc-600 uppercase hover:text-red-400 transition-colors"
              >
                [ Clear ]
              </button>
            )}
          </div>

          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="max-h-48 overflow-y-auto px-5 py-3 space-y-2 no-scrollbar">
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
          <form onSubmit={handleFormSubmit} className="flex items-center gap-3 px-5 py-3 border-t border-white/5">
            <Sparkles size={14} className="text-accent/50 shrink-0" />
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe a change... e.g. 'add a dark mode toggle' or 'make the button bigger'"
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-accent placeholder:text-zinc-600 min-w-0"
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
