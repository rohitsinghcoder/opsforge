import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, Cpu, Plus, Terminal, Battery, BatteryCharging } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

import type { ComponentMeta } from '../../contexts/BlueprintContext';

interface HeaderProps {
  blueprint: boolean;
  setBlueprint: (val: boolean) => void;
  lowPowerMode: boolean;
  setLowPowerMode: (val: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
  setIsCommandOpen: (val: boolean) => void;
  setHoverMeta: (val: ComponentMeta | null) => void;
}

const Header = ({
  blueprint,
  setBlueprint,
  lowPowerMode,
  setLowPowerMode,
  isMenuOpen,
  setIsMenuOpen,
  setIsCommandOpen,
  setHoverMeta
}: HeaderProps) => {
  return (
    <>
      <nav className="fixed w-full z-50 p-6 md:p-10 mix-blend-difference">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-black tracking-tighter uppercase leading-none block text-white">
            Echo <br />Studio
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-widest text-white">
              <Link 
                to="/works" 
                className="hover:text-accent transition-colors"
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
                className="hover:text-accent transition-colors"
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
                to="/ideas" 
                className="hover:text-accent transition-colors"
                onMouseEnter={(e) => {
                  const bounds = (e.target as HTMLElement).getBoundingClientRect();
                  setHoverMeta({
                    name: "<NavLink to='/ideas' />",
                    bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                    props: "hover:text-accent, tracking-widest",
                    targetX: bounds.left + bounds.width / 2,
                    targetY: bounds.top + bounds.height / 2
                  });
                }}
                onMouseLeave={() => setHoverMeta(null)}
              >
                Ideas
              </Link>
              <Link 
                to="/playground" 
                className="hover:text-accent transition-colors"
                onMouseEnter={(e) => {
                  const bounds = (e.target as HTMLElement).getBoundingClientRect();
                  setHoverMeta({
                    name: "<NavLink to='/playground' />",
                    bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                    props: "hover:text-accent, tracking-widest",
                    targetX: bounds.left + bounds.width / 2,
                    targetY: bounds.top + bounds.height / 2
                  });
                }}
                onMouseLeave={() => setHoverMeta(null)}
              >
                Playground
              </Link>
              <Link 
                to="/contact" 
                className="hover:text-accent transition-colors"
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
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all ${blueprint ? 'bg-accent text-black border-accent' : 'border-white/20 text-white hover:border-accent hover:text-accent'}`}
              aria-label={blueprint ? 'Disable blueprint mode' : 'Enable blueprint mode'}
            >
              {blueprint ? <Cpu className="animate-spin" size={18} /> : <EyeOff size={18} />}
            </button>

            <button 
              onClick={() => setLowPowerMode(!lowPowerMode)}
              onMouseEnter={(e) => {
                const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setHoverMeta({
                  name: "<PerformanceToggle />",
                  bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                  props: `mode: ${lowPowerMode ? 'LOW_POWER' : 'HIGH_PERF'}`,
                  targetX: bounds.left + bounds.width / 2,
                  targetY: bounds.top + bounds.height / 2
                });
              }}
              onMouseLeave={() => setHoverMeta(null)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all ${lowPowerMode ? 'bg-amber-400 text-black border-amber-400' : 'border-white/20 text-white hover:border-amber-400 hover:text-amber-400'}`}
              aria-label={lowPowerMode ? 'Switch to high performance mode' : 'Switch to low power mode'}
            >
              {lowPowerMode ? <Battery size={18} /> : <BatteryCharging size={18} />}
            </button>

            <div className="flex items-center gap-4 text-white">
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
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
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
            className={`fixed inset-0 z-[100] ${blueprint ? 'blueprint-mode text-white' : 'bg-black text-white'} p-10 flex flex-col justify-center`}
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
                { label: "Ideas", path: "/ideas" },
                { label: "Playground", path: "/playground" },
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
                    className="group flex items-end gap-6 text-white"
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setBlueprint(!blueprint);
                  }}
                  className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${blueprint ? 'bg-accent text-black border-accent' : 'border-white/10 text-white hover:border-accent'}`}
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
                  className="p-4 rounded-2xl border text-white border-white/10 hover:border-accent flex items-center gap-3 transition-all"
                >
                  <Terminal size={18} />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Ask_Echo</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setLowPowerMode(!lowPowerMode);
                  }}
                  className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${lowPowerMode ? 'bg-amber-400 text-black border-amber-400' : 'border-white/10 text-white hover:border-amber-400 hover:text-amber-400'}`}
                >
                  {lowPowerMode ? <Battery size={18} /> : <BatteryCharging size={18} />}
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    {lowPowerMode ? 'Low_Power' : 'High_Perf'}
                  </span>
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
    </>
  );
};

export default Header;
