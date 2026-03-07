import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Terminal } from 'lucide-react';
import { useUser } from "@clerk/clerk-react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { projects as localProjects } from '../../data/projects';

// Components
import CustomCursor from '../ui/CustomCursor';
import BlueprintMetadata from '../ui/BlueprintMetadata';
import HeatmapOverlay from '../ui/HeatmapOverlay';
import Header from './Header';
import SystemBreach from './SystemBreach';
import SystemBackground from './SystemBackground';
import CommandPaletteOverlay from './CommandPaletteOverlay';

// Context & Hooks
import { BlueprintProvider, type ComponentMeta } from '../../contexts/BlueprintContext';
import useHeatmapTracking from '../../hooks/useHeatmapTracking';
import useVelocityTracker from '../../hooks/useVelocityTracker';
import useCommandPalette from '../../hooks/useCommandPalette';
import useVoiceChat from '../../hooks/useVoiceChat';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const [blueprint, setBlueprint] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoverMeta, setHoverMeta] = useState<ComponentMeta | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);

  // System Breach State
  const [isBreached, setIsBreached] = useState(false);
  const [breachStep, setBreachStep] = useState(0);
  const [breachInput, setBreachInput] = useState("");

  // Custom Hooks
  const { velocityHistory, coords } = useVelocityTracker();
  const { sessionId } = useHeatmapTracking(pathname);

  const {
    isCommandOpen,
    setIsCommandOpen,
    commandInput,
    setCommandInput,
    setSuggestionIndex,
    isAiLoading,
    executeCommand,
    commands,
    chatHistory,
    clearChatHistory,
    addToChatHistory
  } = useCommandPalette({
    blueprint,
    setBlueprint,
    onBreach: () => {
      setIsBreached(true);
      setBreachStep(1);
    }
  });

  // Voice Chat
  const {
    voiceState,
    transcript,
    voiceResponse,
    error: voiceError,
    startVoiceChat,
    stopVoiceChat,
    isSupported: isVoiceSupported,
  } = useVoiceChat(chatHistory, addToChatHistory);

  // Clerk User
  const { user, isSignedIn } = useUser();
  const { isAuthenticated: isConvexAuthenticated } = useConvexAuth();

  // Convex Integration
  const stats = useQuery(api.logs.getStats);
  const seedProjects = useMutation(api.projects.seed);
  const logEvent = useMutation(api.logs.logEvent);
  const projects = useQuery(api.projects.get);
  const syncUser = useMutation(api.users.getOrCreate);
  const trackPageView = useMutation(api.users.trackPageView);

  // Sync user with Convex when they sign in
  const lastSyncedUser = useRef<string>('');
  useEffect(() => {
    if (!isSignedIn || !user || !isConvexAuthenticated) {
      return;
    }

    if (lastSyncedUser.current === user.id) {
      return;
    }

    lastSyncedUser.current = user.id;
    void syncUser({});
  }, [isSignedIn, isConvexAuthenticated, syncUser, user]);

  // Track page views — deduplicated to prevent duplicate DB writes
  const lastTrackedPage = useRef<string>('');
  useEffect(() => {
    const key = `${pathname}|${user?.id || 'anon'}`;
    if (key === lastTrackedPage.current) return;
    lastTrackedPage.current = key;

    trackPageView({
      path: pathname,
      projectSlug: pathname.startsWith('/works/') ? pathname.split('/works/')[1] : undefined,
      sessionId: sessionId,
    });
  }, [pathname, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed data if empty — only attempt once
  const hasSeeded = useRef(false);
  useEffect(() => {
    if (projects && projects.length === 0 && !hasSeeded.current) {
      hasSeeded.current = true;
      seedProjects({ projects: localProjects });
    }
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  // Breach handling
  useEffect(() => {
    if (isBreached && breachStep === 1) {
      logEvent({
        type: "BREACH",
        user: "GUEST_TERMINAL",
        content: "System override sequence initiated"
      });
      const timer = setTimeout(() => setBreachStep(2), 2000);
      return () => clearTimeout(timer);
    }
  }, [isBreached, breachStep, logEvent]);

  useEffect(() => {
    if (breachInput.toUpperCase() === "STATUS_RESYNC" && breachStep === 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBreachStep(3);
      setTimeout(() => {
        setIsBreached(false);
        setBreachStep(0);
        setBreachInput("");
        setBlueprint(true);
      }, 1500);
    }
  }, [breachInput, breachStep]);

  // Menu & glitch effects
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsGlitching(true);
    const timer = setTimeout(() => setIsGlitching(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <BlueprintProvider value={{ blueprint, setBlueprint, hoverMeta, setHoverMeta }}>
      <div className={`relative min-h-screen transition-colors duration-700 ${blueprint ? 'blueprint-mode' : 'bg-[#050505]'} ${isGlitching ? 'glitch-active' : ''} ${isBreached ? 'breach-active' : ''} text-white`}>
        <div className="noise" />
        <CustomCursor />
        <BlueprintMetadata />
        <HeatmapOverlay />

        {/* Mobile FAB for Command Palette */}
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

        {/* System Monitor (Bottom Right) */}
        <div className="fixed bottom-32 right-10 z-[100] flex flex-col items-end pointer-events-none select-none">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[8px] text-accent tracking-[0.3em] uppercase">Input_Velocity</span>
            <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
          </div>
          <svg width="100" height="30" className="overflow-visible">
            <polyline
              fill="none"
              stroke="#c4ff0e"
              strokeWidth="1.5"
              strokeLinejoin="round"
              points={velocityHistory.map((v, i) => `${i * 5},${30 - (v / 100) * 30}`).join(' ')}
              className="transition-all duration-75 ease-linear"
            />
          </svg>
          <p className="font-mono text-[8px] text-zinc-600 mt-2 uppercase tracking-widest">Buffer_Active: 0xFD4</p>
        </div>
        
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
        
        <SystemBackground lowPowerMode={lowPowerMode} blueprint={blueprint} />

        {/* Blueprint HUD */}
        {blueprint && (
          <div className="fixed inset-0 pointer-events-none z-40 border-[20px] border-accent/10">
            <div className="absolute top-10 left-10 font-mono text-[11px] text-accent space-y-1">
              <p>SYSTEM_ID: ECHO_STUDIO_v4.0</p>
              <p>ENVIRONMENT: PRODUCTION_DEBUG</p>
              <p>LATENCY: 14ms</p>
              <p>TOTAL_BREACHES: {stats?.totalBreaches || 0}</p>
            </div>
            <div className="absolute top-10 right-10 font-mono text-[11px] text-accent text-right space-y-1">
              <p>X: {coords.x.toFixed(4)}</p>
              <p>Y: {coords.y.toFixed(4)}</p>
              <p>Z: {coords.z.toFixed(4)}</p>
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
            <p>© 2026 Echo Studio</p>
            <div className="flex gap-8">
              <span className="text-zinc-500">Rohit Singh</span>
            </div>
            <p>{blueprint ? "MODE: DEBUG_ACTIVE" : "Built for the bold"}</p>
          </div>
        </footer>
      </div>
    </BlueprintProvider>
  );
};

export default Layout;
