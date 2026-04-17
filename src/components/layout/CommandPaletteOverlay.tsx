import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, Loader2, Volume2, Zap } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface CommandPaletteOverlayProps {
  isCommandOpen: boolean;
  setIsCommandOpen: (open: boolean) => void;
  commandInput: string;
  setCommandInput: (val: string) => void;
  setSuggestionIndex: (index: number) => void;
  executeCommand: (e: React.FormEvent) => void;
  isVoiceSupported: boolean;
  voiceState: string;
  startVoiceChat: () => void;
  stopVoiceChat: () => void;
  transcript: string;
  voiceResponse: string;
  voiceError: string | null;
  isAiLoading: boolean;
  chatHistory: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>;
  clearChatHistory: () => void;
  commands: string[];
}

const CommandPaletteOverlay = ({
  isCommandOpen,
  setIsCommandOpen,
  commandInput,
  setCommandInput,
  setSuggestionIndex,
  executeCommand,
  isVoiceSupported,
  voiceState,
  startVoiceChat,
  stopVoiceChat,
  transcript,
  voiceResponse,
  voiceError,
  isAiLoading,
  chatHistory,
  clearChatHistory,
  commands
}: CommandPaletteOverlayProps) => {
  const focusTrapRef = useFocusTrap(isCommandOpen);
  const [highlightedCmd, setHighlightedCmd] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedCmd((prev) => (prev + 1) % commands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedCmd((prev) => (prev <= 0 ? commands.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && highlightedCmd >= 0 && !commandInput.trim()) {
      e.preventDefault();
      setCommandInput(commands[highlightedCmd] + ' ');
      setHighlightedCmd(-1);
    }
  };

  return (
    <AnimatePresence>
      {isCommandOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCommandOpen(false)}
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-start justify-center pt-[10vh] md:pt-[20vh] px-4 md:px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div 
            ref={focusTrapRef}
            initial={{ y: -20, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -20, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="w-full max-w-2xl bg-[#0a0a0a] border border-accent/30 rounded-2xl shadow-[0_0_50px_rgba(196,255,14,0.1)] overflow-hidden"
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-6">
              <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Echo_Terminal</span>
              <button 
                onClick={() => setIsCommandOpen(false)}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
                aria-label="Close command palette"
              >
                <Plus className="rotate-45" size={16} />
              </button>
            </div>

            {/* Command Input */}
            <form onSubmit={executeCommand} className="p-4 md:p-6 flex items-center gap-2 md:gap-4">
              <span className="font-mono text-accent font-bold animate-pulse text-sm md:text-base shrink-0">~$</span>
              <input 
                autoFocus
                value={commandInput}
                onChange={(e) => {
                  setCommandInput(e.target.value);
                  setSuggestionIndex(-1);
                }}
                placeholder="/ask your question..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-accent placeholder:text-accent/30 text-sm md:text-base min-w-0"
              />
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={voiceState === 'idle' ? startVoiceChat : stopVoiceChat}
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    voiceState === 'listening'
                      ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                      : voiceState === 'processing'
                        ? 'bg-accent/20 border-accent text-accent'
                        : voiceState === 'speaking'
                          ? 'bg-accent/20 border-accent text-accent'
                          : 'border-white/20 text-zinc-500 hover:border-accent hover:text-accent'
                  }`}
                  aria-label={voiceState === 'idle' ? 'Start voice chat' : 'Stop voice chat'}
                >
                  {voiceState === 'listening' ? <Mic size={14} /> :
                   voiceState === 'processing' ? <Loader2 size={14} className="animate-spin" /> :
                   voiceState === 'speaking' ? <Volume2 size={14} /> :
                   <Mic size={14} />}
                </button>
              )}
            </form>

            {/* Voice State Indicator */}
            <AnimatePresence>
              {voiceState !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 md:px-6 pb-3 border-t border-accent/10"
                >
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {voiceState === 'listening' && (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                          <span className="font-mono text-xs text-red-400 uppercase tracking-widest truncate">
                            {transcript || 'Listening...'}
                          </span>
                        </>
                      )}
                      {voiceState === 'processing' && (
                        <>
                          <Loader2 size={12} className="text-accent animate-spin shrink-0" />
                          <span className="font-mono text-xs text-accent truncate">
                            "{transcript}"
                          </span>
                        </>
                      )}
                      {voiceState === 'speaking' && (
                        <>
                          <Volume2 size={12} className="text-accent animate-pulse shrink-0" />
                          <span className="font-mono text-xs text-zinc-400 truncate">
                            {voiceResponse.substring(0, 80)}{voiceResponse.length > 80 ? '...' : ''}
                          </span>
                        </>
                      )}
                      {voiceState === 'error' && (
                        <span className="font-mono text-xs text-red-400">{voiceError}</span>
                      )}
                    </div>
                    <button
                      onClick={stopVoiceChat}
                      className="font-mono text-[8px] text-zinc-600 uppercase hover:text-red-400 transition-colors shrink-0 ml-3"
                    >
                      [ Stop ]
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Chat History Area */}
            {(isAiLoading || chatHistory.length > 0) && (
              <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-white/5 pt-4 md:pt-6 max-h-[35vh] md:max-h-[40vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Zap size={14} className="text-accent animate-pulse" />
                    <span className="font-mono text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-widest">Chat_Session</span>
                  </div>
                  {chatHistory.length > 0 && (
                    <button 
                      onClick={clearChatHistory}
                      className="font-mono text-[8px] text-zinc-600 uppercase hover:text-red-400 transition-colors"
                    >
                      [ Clear ]
                    </button>
                  )}
                </div>
                
                {/* Chat Messages */}
                <div className="space-y-4">
                  {chatHistory.map((msg, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className={`font-mono text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'text-accent pl-3 md:pl-4 border-l-2 border-accent/30' 
                          : 'text-zinc-300 pl-3 md:pl-4 border-l-2 border-zinc-700'
                      }`}
                    >
                      <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">
                        {msg.role === 'user' ? 'You:' : 'Echo-1:'}
                      </span>
                      <span className="whitespace-pre-wrap break-words">{msg.parts[0]?.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Loading indicator */}
                {isAiLoading && (
                  <div className="flex gap-2 mt-4 pl-3 md:pl-4 border-l-2 border-zinc-700">
                    <div className="w-1 h-4 bg-accent animate-bounce" />
                    <div className="w-1 h-4 bg-accent animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-4 bg-accent animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>
            )}

            {/* Commands List */}
            <div className="px-4 md:px-6 pb-4 md:pb-6 grid grid-cols-2 gap-2 border-t border-white/5 pt-4" role="listbox" aria-label="Available commands">
              {commands.map((cmd: string, idx: number) => (
                <button 
                  key={cmd}
                  type="button"
                  role="option"
                  aria-selected={highlightedCmd === idx}
                  onClick={() => {
                    setCommandInput(cmd + ' ');
                    setHighlightedCmd(-1);
                  }}
                  className={`font-mono text-[10px] uppercase tracking-widest transition-colors text-left py-1 ${
                    highlightedCmd === idx ? 'text-accent bg-accent/10 rounded px-1' : commandInput.startsWith(cmd) ? 'text-accent' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPaletteOverlay;
