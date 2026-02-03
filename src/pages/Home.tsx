import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlueprintContext } from '../contexts/BlueprintContext';
import MagneticButton from '../components/ui/MagneticButton';

const Home = () => {
  const navigate = useNavigate();
  const { blueprint, setHoverMeta } = useBlueprintContext();
  const [isInitializing, setIsInitializing] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  const startSequence = () => {
    setIsInitializing(true);
    // Exponential acceleration: 400ms down to 20ms
    const timings = [400, 300, 200, 150, 100, 80, 60, 40, 30, 20];
    let totalTime = 0;
    
    timings.forEach((time, index) => {
      totalTime += time;
      setTimeout(() => {
        setLoadStep(index + 1);
        if (index === timings.length - 1) {
          setTimeout(() => navigate('/vault'), 500);
        }
      }, totalTime);
    });
  };
  
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 pt-32 pb-20">
      <AnimatePresence>
        {isInitializing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-accent flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Top Green Block */}
            <motion.div 
              initial={{ height: "50vh" }}
              animate={{ height: "25vh" }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="absolute top-0 w-full bg-accent z-10"
            />

            {/* Bottom Green Block */}
            <motion.div 
              initial={{ height: "50vh" }}
              animate={{ height: "25vh" }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="absolute bottom-0 w-full bg-accent z-10"
            />

            {/* Central Inverted Core */}
            <div className="relative w-full h-[50vh] bg-black flex flex-col items-center justify-center overflow-hidden border-y-2 border-black">
              {/* Scanline Animation */}
              <motion.div 
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-full h-32 bg-gradient-to-b from-transparent via-accent/10 to-transparent pointer-events-none"
              />
              
              {/* Loading Logs */}
              <div className="font-mono text-accent text-[10px] md:text-xs space-y-1 md:space-y-2 uppercase tracking-widest font-bold z-20 text-center px-4">
                {loadStep >= 1 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}SYS_KERNEL_BOOT [OK]</motion.p>}
                {loadStep >= 2 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}MEMORY_ALLOC_EXE_1 [0x7FF]</motion.p>}
                {loadStep >= 3 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}BRIDGE_ESTABLISHED_EXE_2</motion.p>}
                {loadStep >= 4 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}SHADERS_COMPILED_EXE_3</motion.p>}
                {loadStep >= 5 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}GEOMETRY_BUFFER_EXE_4</motion.p>}
                {loadStep >= 6 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}NEURAL_LINK_EXE_5 [SYNC]</motion.p>}
                {loadStep >= 7 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}CORE_TEMP_STABLE_EXE_6</motion.p>}
                {loadStep >= 8 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}ASSET_STREAM_EXE_7 [HI_FI]</motion.p>}
                {loadStep >= 9 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}LATENCY_COMP_EXE_8 [4MS]</motion.p>}
                {loadStep >= 10 && <motion.p className="text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{" >> "}INITIALIZATION_SUCCESSFUL</motion.p>}
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-12 w-48 md:w-80 h-1 bg-zinc-900 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(loadStep / 10) * 100}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="h-full bg-accent shadow-[0_0_15px_#c4ff0e]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <span className="inline-block px-4 py-1.5 rounded-full border border-accent/30 text-accent font-mono text-[10px] uppercase tracking-[0.2em] mb-12">
            {blueprint ? ">> SYSTEM_SCAN_COMPLETE" : "Digital Experience Agency"}
          </span>
          <div className="relative">
            <h1 
              ref={titleRef}
              onMouseEnter={() => {
                const bounds = titleRef.current?.getBoundingClientRect();
                if (bounds) {
                  setHoverMeta({
                    name: "<HeroTitle />",
                    bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                    props: "tracking-tighter, uppercase",
                    targetX: bounds.left + bounds.width / 2,
                    targetY: bounds.top + bounds.height / 2
                  });
                }
              }}
              onMouseLeave={() => setHoverMeta(null)}
              className="text-[16vw] md:text-[14vw] leading-[0.75] font-black uppercase tracking-tighter mb-16"
            >
              Echo <br /> 
              <span className="text-outline italic">Studio</span>
            </h1>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
            <p className="max-w-md text-zinc-400 text-lg md:text-xl font-medium leading-relaxed">
              We engineer high-fidelity digital interfaces for the next generation of spatial and web ecosystems.
            </p>
            <MagneticButton onClick={startSequence}>
              <button className="w-40 h-40 magnetic-btn hover:scale-105 transition-transform group relative overflow-hidden">
                <div className="absolute inset-0 bg-white scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500" />
                <div className="relative z-10 group-hover:text-black font-black uppercase tracking-widest text-xs">Explore</div>
              </button>
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Home;
