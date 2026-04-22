import { motion, AnimatePresence } from 'framer-motion';

interface SystemBreachProps {
  isBreached: boolean;
  breachStep: number;
  breachInput: string;
  setBreachInput: (input: string) => void;
}

const SystemBreach = ({
  isBreached,
  breachStep,
  breachInput,
  setBreachInput
}: SystemBreachProps) => {
  return (
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
                      aria-label="Authorization Key"
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
  );
};

export default SystemBreach;
