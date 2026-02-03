import React, { useState, useEffect, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, Activity, Cpu, Plus, Zap, Terminal } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser
} from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { projects as localProjects } from '../../data/projects';

// Components
import MorphingObject from '../3d/MorphingObject';
import CustomCursor from '../ui/CustomCursor';
import BlueprintMetadata from '../ui/BlueprintMetadata';
import HeatmapOverlay from '../ui/HeatmapOverlay';

// Context & Hooks
import { BlueprintProvider, type ComponentMeta } from '../../contexts/BlueprintContext';
import useHeatmapTracking from '../../hooks/useHeatmapTracking';
import useVelocityTracker from '../../hooks/useVelocityTracker';
import useCommandPalette from '../../hooks/useCommandPalette';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation();
  const [blueprint, setBlueprint] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoverMeta, setHoverMeta] = useState<ComponentMeta | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);

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
    clearChatHistory
  } = useCommandPalette({
    blueprint,
    setBlueprint,
    onBreach: () => {
      setIsBreached(true);
      setBreachStep(1);
    }
  });

  // Clerk User
  const { user, isSignedIn } = useUser();

  // Convex Integration
  const stats = useQuery(api.logs.getStats);
  const seedProjects = useMutation(api.projects.seed);
  const logEvent = useMutation(api.logs.logEvent);
  const projects = useQuery(api.projects.get);
  const syncUser = useMutation(api.users.getOrCreate);
  const trackPageView = useMutation(api.users.trackPageView);

  // Sync user with Convex when they sign in
  useEffect(() => {
    if (isSignedIn && user) {
      syncUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || user.firstName || 'Anonymous',
        imageUrl: user.imageUrl,
      });
    }
  }, [isSignedIn, user, syncUser]);

  // Track page views
  useEffect(() => {
    trackPageView({
      clerkId: user?.id,
      path: pathname,
      projectSlug: pathname.startsWith('/works/') ? pathname.split('/works/')[1] : undefined,
      sessionId: sessionId,
    });
  }, [pathname, user?.id, trackPageView, sessionId]);

  // Seed data if empty
  useEffect(() => {
    if (projects && projects.length === 0) {
      seedProjects({ projects: localProjects });
    }
  }, [projects, seedProjects]);

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

        {/* System Breach UI */}
        <AnimatePresence>
          {isBreached && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-6"
            >
              <div className="absolute inset-0 bg-red-900/20 animate-pulse pointer-events-none" />
              <div className="max-w-xl w-full font-mono space-y-8 relative z-10">
                {breachStep === 1 && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-red-600 text-black p-8 border-4 border-white shadow-[0_0_100px_rgba(255,0,0,0.8)]"
                  >
                    <h2 className="text-5xl font-black mb-4 flex items-center gap-4 italic underline tracking-tighter">
                      SYSTEM_HALTED
                    </h2>
                    <div className="space-y-2 text-[10px] font-bold uppercase">
                      <p>{" >>> "}FATAL_EXCEPTION_0x000000FE</p>
                      <p>{" >>> "}CORE_DUMP_IN_PROGRESS...</p>
                      <p>{" >>> "}MEMORY_LEAK_DETECTED_IN_SECTOR_7</p>
                    </div>
                  </motion.div>
                )}

                {breachStep >= 2 && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-black text-red-500 p-8 border-2 border-red-600"
                  >
                    <h2 className="text-2xl font-black mb-6 tracking-[0.2em] uppercase text-center">
                      {breachStep === 3 ? "CORE_RESTORED" : "TERMINAL_DECRYPTION"}
                    </h2>
                    
                    {breachStep === 2 && (
                      <div className="space-y-6">
                        <div className="bg-red-500/10 p-4 border border-red-500/30">
                          <p className="text-[10px] text-red-400 mb-2 font-bold">REQUIRED_AUTH_KEY:</p>
                          <p className="text-xl font-black tracking-[0.5em] text-center">STATUS_RESYNC</p>
                        </div>
                        <input 
                          autoFocus
                          value={breachInput}
                          onChange={(e) => setBreachInput(e.target.value)}
                          className="w-full bg-transparent border-b-2 border-red-600 py-4 outline-none text-red-500 text-2xl font-black text-center tracking-widest placeholder:text-red-900"
                          placeholder="INPUT_KEY"
                        />
                      </div>
                    )}

                    {breachStep === 3 && (
                      <div className="space-y-4 text-center">
                        <div className="text-4xl font-black text-accent animate-bounce">OK</div>
                        <p className="text-xs font-bold tracking-[0.3em]">RE-ESTABLISHING_NEURAL_STABILITY</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
        
        {/* Command Palette Overlay */}
        <AnimatePresence>
          {isCommandOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandOpen(false)}
              className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-start justify-center pt-[10vh] md:pt-[20vh] px-4 md:px-6"
            >
              <motion.div 
                initial={{ y: -20, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: -20, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
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
                </form>

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
                <div className="px-4 md:px-6 pb-4 md:pb-6 grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                  {commands.map(cmd => (
                    <button 
                      key={cmd}
                      type="button"
                      onClick={() => {
                        setCommandInput(cmd + ' ');
                      }}
                      className={`font-mono text-[10px] uppercase tracking-widest transition-colors text-left py-1 ${commandInput.startsWith(cmd) ? 'text-accent' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Persistent 3D Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
              <MorphingObject blueprint={blueprint} />
            </Suspense>
          </Canvas>
        </div>

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

        <nav className="fixed w-full z-50 p-6 md:p-10 mix-blend-difference">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-black tracking-tighter uppercase leading-none block">
              Echo <br />Studio
            </Link>
            <div className="flex items-center gap-4 md:gap-8">
              <div className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-widest">
                <Link 
                  to="/works" 
                  className="hover:text-accent"
                  onMouseEnter={(e) => {
                    const bounds = (e.target as HTMLElement).getBoundingClientRect();
                    setHoverMeta({
                      name: "<NavLink to='/works' />",
                      bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                      props: "hover:text-accent, tracking-widest",
                      targetX: bounds.left + bounds.width / 2,
                      targetY: bounds.top + bounds.height / 2
                    });
                  }}
                  onMouseLeave={() => setHoverMeta(null)}
                >
                  Works
                </Link>
                <Link 
                  to="/archive" 
                  className="hover:text-accent"
                  onMouseEnter={(e) => {
                    const bounds = (e.target as HTMLElement).getBoundingClientRect();
                    setHoverMeta({
                      name: "<NavLink to='/archive' />",
                      bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                      props: "hover:text-accent, tracking-widest",
                      targetX: bounds.left + bounds.width / 2,
                      targetY: bounds.top + bounds.height / 2
                    });
                  }}
                  onMouseLeave={() => setHoverMeta(null)}
                >
                  Archive
                </Link>
                <Link 
                  to="/contact" 
                  className="hover:text-accent"
                  onMouseEnter={(e) => {
                    const bounds = (e.target as HTMLElement).getBoundingClientRect();
                    setHoverMeta({
                      name: "<NavLink to='/contact' />",
                      bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                      props: "hover:text-accent, tracking-widest",
                      targetX: bounds.left + bounds.width / 2,
                      targetY: bounds.top + bounds.height / 2
                    });
                  }}
                  onMouseLeave={() => setHoverMeta(null)}
                >
                  Contact
                </Link>
              </div>
              <button 
                onClick={() => setBlueprint(!blueprint)}
                onMouseEnter={(e) => {
                  const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setHoverMeta({
                    name: "<SystemToggle />",
                    bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                    props: `active_mode: ${blueprint ? 'DEBUG' : 'PROD'}`,
                    targetX: bounds.left + bounds.width / 2,
                    targetY: bounds.top + bounds.height / 2
                  });
                }}
                onMouseLeave={() => setHoverMeta(null)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all ${blueprint ? 'bg-accent text-black border-accent' : 'border-white/20 hover:border-accent'}`}
              >
                {blueprint ? <Cpu className="animate-spin" size={18} /> : <EyeOff size={18} />}
              </button>

              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 border border-accent/30 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-accent hover:text-black transition-all">
                      Login
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-10 h-10 border border-accent/20",
                        userButtonPopoverCard: "bg-black border border-white/10",
                      }
                    }}
                  />
                </SignedIn>
              </div>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 md:hidden border border-white/20 rounded-full"
              >
                <motion.span 
                  animate={{ rotate: isMenuOpen ? 45 : 0, y: isMenuOpen ? 4 : 0 }}
                  className="w-4 h-0.5 bg-white" 
                />
                <motion.span 
                  animate={{ opacity: isMenuOpen ? 0 : 1 }}
                  className="w-4 h-0.5 bg-white" 
                />
                <motion.span 
                  animate={{ rotate: isMenuOpen ? -45 : 0, y: isMenuOpen ? -4 : 0 }}
                  className="w-4 h-0.5 bg-white" 
                />
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className={`fixed inset-0 z-[100] ${blueprint ? 'blueprint-mode' : 'bg-black'} p-10 flex flex-col justify-center`}
            >
              <div className="absolute top-10 right-10 flex items-center gap-4">
                <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">System_Access: 0x8F</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>

              <div className="space-y-12">
                {[
                  { label: "Home", path: "/" },
                  { label: "Works", path: "/works" },
                  { label: "Archive", path: "/archive" },
                  { label: "Contact", path: "/contact" },
                  { label: "Vault", path: "/vault" },
                  { label: "My Projects", path: "/my-projects" },
                ].map((item, idx) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link 
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-end gap-6"
                    >
                      <span className="font-mono text-[10px] text-accent mb-2">0{idx + 1}</span>
                      <h2 className="text-6xl font-black uppercase tracking-tighter group-hover:italic group-hover:text-accent transition-all leading-none">
                        {item.label}
                      </h2>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="mt-16 pt-10 border-t border-white/5 space-y-8">
                {/* Quick Actions Row */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setBlueprint(!blueprint);
                    }}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${blueprint ? 'bg-accent text-black border-accent' : 'border-white/10 hover:border-accent'}`}
                  >
                    {blueprint ? <Cpu size={18} /> : <EyeOff size={18} />}
                    <span className="font-mono text-[10px] uppercase tracking-widest">
                      {blueprint ? 'Debug_On' : 'Debug_Off'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsCommandOpen(true);
                    }}
                    className="p-4 rounded-2xl border border-white/10 hover:border-accent flex items-center gap-3 transition-all"
                  >
                    <Terminal size={18} />
                    <span className="font-mono text-[10px] uppercase tracking-widest">Ask_Echo</span>
                  </button>
                </div>

                {/* Account Row */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest mb-4">Account</p>
                    <SignedOut>
                      <SignInButton mode="modal">
                        <button className="text-xs font-bold uppercase tracking-widest text-accent hover:italic">Login_Access</button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex items-center gap-3">
                        <UserButton />
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">Manage_Profile</span>
                      </div>
                    </SignedIn>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest mb-4">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                      <span className="text-[10px] uppercase font-mono text-accent">Active_Session</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <footer className="py-20 px-6 border-t border-white/5 relative z-20 bg-transparent">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            <p>© 2026 Echo Studio</p>
            <div className="flex gap-8">
              <a href="#">Twitter</a>
              <a href="#">Instagram</a>
            </div>
            <p>{blueprint ? "MODE: DEBUG_ACTIVE" : "Built for the bold"}</p>
          </div>
        </footer>
      </div>
    </BlueprintProvider>
  );
};

export default Layout;
