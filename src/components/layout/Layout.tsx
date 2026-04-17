import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Terminal } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

import CustomCursor from '../ui/CustomCursor';
import FpsCounter from '../ui/FpsCounter';
import Header from './Header';
import SystemBreach from './SystemBreach';

const BlueprintMetadata = lazy(() => import('../ui/BlueprintMetadata'));
const HeatmapOverlay = lazy(() => import('../ui/HeatmapOverlay'));
const CommandPaletteOverlay = lazy(() => import('./CommandPaletteOverlay'));

import { BlueprintProvider, type ComponentMeta } from '../../contexts/BlueprintContext';
import useHeatmapTracking from '../../hooks/useHeatmapTracking';
import useVelocityTracker from '../../hooks/useVelocityTracker';
import useCommandPalette from '../../hooks/useCommandPalette';
import useVoiceChat from '../../hooks/useVoiceChat';
import { useConvexSync } from '../../hooks/useConvexSync';
import { useSystemBreach } from '../../hooks/useSystemBreach';

interface LayoutProps {
  children: React.ReactNode;
}

const SystemBackground = lazy(() => import('./SystemBackground'));

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const [blueprint, setBlueprint] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoverMeta, setHoverMeta] = useState<ComponentMeta | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);

  const { polylineRef, coordsRef } = useVelocityTracker();
  const coordsDisplayRef = useRef<HTMLDivElement>(null);

  // Poll coordsRef and update blueprint HUD directly — only when blueprint is active
  useEffect(() => {
    if (!blueprint) return;
    const interval = setInterval(() => {
      if (coordsDisplayRef.current) {
        const c = coordsRef.current;
        coordsDisplayRef.current.innerHTML =
          `<p>X: ${c.x.toFixed(4)}</p><p>Y: ${c.y.toFixed(4)}</p><p>Z: ${c.z.toFixed(4)}</p>`;
      }
    }, 250);
    return () => clearInterval(interval);
  }, [blueprint, coordsRef]);
  const { sessionId } = useHeatmapTracking(pathname);

  const {
    isBreached, breachStep, breachInput, setBreachInput,
    triggerBreach,
  } = useSystemBreach({
    onResolved: () => setBlueprint(true),
  });

  const {
    isCommandOpen, setIsCommandOpen,
    commandInput, setCommandInput,
    setSuggestionIndex, isAiLoading,
    executeCommand, commands,
    chatHistory, clearChatHistory, addToChatHistory,
  } = useCommandPalette({
    blueprint,
    setBlueprint,
    onBreach: triggerBreach,
  });

  const {
    voiceState, transcript, voiceResponse,
    error: voiceError, startVoiceChat, stopVoiceChat,
    isSupported: isVoiceSupported,
  } = useVoiceChat(chatHistory, addToChatHistory);

  const stats = useQuery(api.logs.getStats);

  useConvexSync(pathname, sessionId);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
  }, [isMenuOpen]);

  useEffect(() => {
    let timer: number | null = null;
    const frame = window.requestAnimationFrame(() => {
      setIsGlitching(true);
      timer = window.setTimeout(() => setIsGlitching(false), 300);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [pathname]);

  return (
    <BlueprintProvider value={{ blueprint, setBlueprint, hoverMeta, setHoverMeta }}>
      <div className={`relative min-h-screen transition-colors duration-700 ${blueprint ? 'blueprint-mode' : 'bg-[#050505]'} ${isGlitching ? 'glitch-active' : ''} ${isBreached ? 'breach-active' : ''} text-white`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-accent focus:text-black focus:rounded-lg focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest"
        >
          Skip to content
        </a>
        <div className="noise" />
        <FpsCounter visible />
        <CustomCursor />
        {blueprint && (
          <Suspense fallback={null}>
            <BlueprintMetadata />
            <HeatmapOverlay />
          </Suspense>
        )}

        <button
          onClick={() => setIsCommandOpen(true)}
          className="fixed bottom-6 right-6 z-[90] md:hidden w-14 h-14 rounded-full bg-accent text-black flex items-center justify-center shadow-[0_0_30px_rgba(196,255,14,0.4)] active:scale-95 transition-transform"
          aria-label="Open AI Assistant"
        >
          <Terminal size={24} />
        </button>

        <SystemBreach
          isBreached={isBreached}
          breachStep={breachStep}
          breachInput={breachInput}
          setBreachInput={setBreachInput}
        />

        {blueprint && (
        <div className="fixed bottom-32 right-10 z-[100] flex flex-col items-end pointer-events-none select-none">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[8px] text-accent tracking-[0.3em] uppercase">Input_Velocity</span>
            <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
          </div>
          <svg width="100" height="30" className="overflow-visible" aria-hidden="true">
            <polyline
              ref={polylineRef}
              fill="none"
              stroke="#c4ff0e"
              strokeWidth="1.5"
              strokeLinejoin="round"
              points=""
            />
          </svg>
          <p className="font-mono text-[8px] text-zinc-600 mt-2 uppercase tracking-widest">Buffer_Active: 0xFD4</p>
        </div>
        )}

        <Suspense fallback={null}>
          <CommandPaletteOverlay
            isCommandOpen={isCommandOpen}
            setIsCommandOpen={setIsCommandOpen}
            commandInput={commandInput}
            setCommandInput={setCommandInput}
            setSuggestionIndex={setSuggestionIndex}
            executeCommand={executeCommand}
            isVoiceSupported={isVoiceSupported}
            voiceState={voiceState}
            startVoiceChat={startVoiceChat}
            stopVoiceChat={stopVoiceChat}
            transcript={transcript}
            voiceResponse={voiceResponse}
            voiceError={voiceError}
            isAiLoading={isAiLoading}
            chatHistory={chatHistory}
            clearChatHistory={clearChatHistory}
            commands={commands}
          />
        </Suspense>

        <Suspense fallback={null}>
          <SystemBackground lowPowerMode={lowPowerMode} blueprint={blueprint} />
        </Suspense>

        {blueprint && (
          <div className="fixed inset-0 pointer-events-none z-40 border-[20px] border-accent/10">
            <div className="absolute top-10 left-10 font-mono text-[11px] text-accent space-y-1">
              <p>SYSTEM_ID: ECHO_STUDIO_v4.0</p>
              <p>ENVIRONMENT: PRODUCTION_DEBUG</p>
              <p>LATENCY: 14ms</p>
              <p>TOTAL_BREACHES: {stats?.totalBreaches || 0}</p>
            </div>
            <div ref={coordsDisplayRef} className="absolute top-10 right-10 font-mono text-[11px] text-accent text-right space-y-1">
              <p>X: 0.0000</p>
              <p>Y: 0.0000</p>
              <p>Z: 0.0000</p>
            </div>
            <div className="absolute bottom-10 left-10"><Activity className="text-accent animate-pulse" size={20} /></div>
          </div>
        )}

        <Header
          blueprint={blueprint}
          setBlueprint={setBlueprint}
          lowPowerMode={lowPowerMode}
          setLowPowerMode={setLowPowerMode}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          setIsCommandOpen={setIsCommandOpen}
          setHoverMeta={setHoverMeta}
        />

        <motion.main
          id="main-content"
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          {children}
        </motion.main>

        <footer className="py-20 px-6 border-t border-white/5 relative z-20 bg-transparent">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            <p>&copy; 2026 Echo Studio</p>
            <div className="flex gap-8">
              <span className="text-zinc-500">Rohit Singh</span>
            </div>
            <p>{blueprint ? 'MODE: DEBUG_ACTIVE' : 'Built for the bold'}</p>
          </div>
        </footer>
      </div>
    </BlueprintProvider>
  );
};

export default Layout;
