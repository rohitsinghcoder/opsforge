import { motion } from 'framer-motion';
import { Eye, EyeOff, Link2, Rocket, Loader2 } from 'lucide-react';

interface Props {
  visibility: string;
  onVisibilityChange: (visibility: string) => void;
  onCompile: () => void;
  isCompiling: boolean;
  isValid: boolean;
}

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Eye, desc: 'Anyone can view' },
  { value: 'unlisted', label: 'Unlisted', icon: Link2, desc: 'Only with link' },
  { value: 'private', label: 'Private', icon: EyeOff, desc: 'Only you' },
];

const BuilderStepDeploy = ({
  visibility,
  onVisibilityChange,
  onCompile,
  isCompiling,
  isValid,
}: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Visibility Options */}
      <div className="space-y-3">
        <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block">
          Visibility_Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onVisibilityChange(opt.value)}
              className={`p-4 rounded-xl border transition-all text-left ${
                visibility === opt.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-white/10 hover:border-white/30 text-zinc-400'
              }`}
            >
              <opt.icon size={20} className="mb-2" />
              <p className="font-bold text-sm uppercase">{opt.label}</p>
              <p className="font-mono text-[9px] text-zinc-500 uppercase mt-1">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Compile Animation Box */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-transparent to-accent/20 rounded-2xl animate-pulse opacity-50" />
        <div className="relative p-8 border border-accent/30 rounded-2xl bg-black/50 text-center space-y-6">
          {isCompiling ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto border-2 border-accent border-t-transparent rounded-full"
              />
              <div className="font-mono text-accent space-y-1">
                <p className="text-lg font-bold uppercase tracking-widest animate-pulse">
                  Compiling...
                </p>
                <p className="text-[10px] text-zinc-500 uppercase">
                  WRITING_TO_DATABASE...
                </p>
              </div>
            </>
          ) : (
            <>
              <Rocket size={48} className="mx-auto text-accent" />
              <div>
                <p className="font-mono text-lg font-bold text-white uppercase tracking-widest">
                  Ready_To_Deploy
                </p>
                <p className="font-mono text-[10px] text-zinc-500 uppercase mt-2">
                  Your project card will be compiled and deployed
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compile Button */}
      <button
        onClick={onCompile}
        disabled={!isValid || isCompiling}
        className={`w-full py-5 rounded-xl font-black text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
          isValid && !isCompiling
            ? 'bg-accent text-black hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
        }`}
      >
        {isCompiling ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            COMPILING...
          </>
        ) : (
          <>
            <Rocket size={20} />
            COMPILE & DEPLOY
          </>
        )}
      </button>

      {!isValid && (
        <p className="font-mono text-[10px] text-red-400 uppercase text-center">
          Error: Missing required fields (title, category, image, description)
        </p>
      )}
    </motion.div>
  );
};

export default BuilderStepDeploy;
