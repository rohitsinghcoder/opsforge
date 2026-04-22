import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { useAction } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Zap, ArrowRight, RefreshCw, Folder, FileCode, ChevronDown, ChevronRight, X } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { getOrCreateClientId } from '../utils/clientIdentity';
import ParticleForge from '../components/3d/ParticleForge';
import { usePageTitle } from '../hooks/usePageTitle';
import useHeatmapTracking from '../hooks/useHeatmapTracking';
import TechSelector from '../components/ui/TechSelector';

interface ProjectIdea {
  title: string;
  description: string;
  stack: string[];
  files: string[];
  steps: string[];
  category: string;
  complexity: string;
}

const PRESET_SKILLS = [
  'React', 'TypeScript', 'Three.js', 'Node.js', 'Python', 'Go', 'Rust',
  'Tailwind CSS', 'WebGL', 'Framer Motion', 'PostgreSQL', 'MongoDB', 'OpenAI API',
];

export default function IdeaForge() {
  usePageTitle('Idea Forge');
  useHeatmapTracking('/forge');
  const navigate = useNavigate();
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ProjectIdea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState(false);
  const [clientId] = useState(() => getOrCreateClientId());
  
  const generateProjectIdea = useAction(api.ai.generateProjectIdea);

  const handleGenerate = async () => {
    if (selectedSkills.length === 0) {
      setError('Neural interface requires at least one skill to initialize.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowConfig(false);

    try {
      const response = await generateProjectIdea({
        skills: selectedSkills,
        complexity,
        clientId,
      });

      if (typeof response === 'string') {
        setError(response);
        setShowConfig(true);
      } else {
        setResult(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neural link failure. Please try again.');
      setShowConfig(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForge = () => {
    setResult(null);
    setShowConfig(true);
  };

  return (
    <div className="w-full h-screen bg-bg relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 3, 10], fov: 50 }}>
          <color attach="background" args={['#030508']} />
          <ambientLight intensity={0.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <ParticleForge isGenerating={isGenerating} />
          </Float>
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={isGenerating ? 4 : 0.5} 
            maxDistance={15}
            minDistance={2}
          />
        </Canvas>
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="container mx-auto h-full flex flex-col items-center justify-center p-6">
          
          <AnimatePresence mode="wait">
            {/* Initial Header */}
            {showConfig && !result && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="max-w-xl w-full bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl pointer-events-auto shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
                    <Zap size={20} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">The_Forge</h2>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Neural Idea Synthesizer</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <TechSelector
                    selected={selectedSkills}
                    onChange={setSelectedSkills}
                    presets={PRESET_SKILLS}
                    label="Skill_Input"
                  />

                  <div>
                    <label className="font-mono text-[10px] text-accent uppercase tracking-widest block mb-3">Complexity</label>
                    <div className="flex gap-2">
                      {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => setComplexity(level)}
                          className={`flex-1 py-2 rounded-lg border font-mono text-[10px] uppercase transition-all ${
                            complexity === level
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-white/5 text-zinc-500 hover:border-white/20'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={selectedSkills.length === 0}
                    className="w-full py-4 bg-accent text-black font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    Initialize_Forge
                  </button>
                  
                  {error && <p className="text-red-400 font-mono text-[10px] text-center">{error}</p>}
                </div>
              </motion.div>
            )}

            {/* Generating State */}
            {isGenerating && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="relative mb-8">
                   <Loader2 size={64} className="text-accent animate-spin mx-auto opacity-20" />
                   <Sparkles size={32} className="text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-white mb-2 animate-pulse">Forging_Reality</h2>
                <p className="font-mono text-xs text-accent uppercase tracking-widest">Synthesizing project blueprints...</p>
              </motion.div>
            )}

            {/* Result View */}
            {result && !isGenerating && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto"
              >
                {/* Left Column: Info */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-black/60 backdrop-blur-xl border border-accent/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                       <button onClick={resetForge} className="text-zinc-500 hover:text-white transition-colors">
                         <X size={20} />
                       </button>
                    </div>
                    <div className="flex gap-3 mb-4">
                      <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-mono text-accent uppercase">{result.category}</span>
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400 uppercase">{result.complexity}</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-4 leading-tight">{result.title}</h2>
                    <p className="text-zinc-400 leading-relaxed mb-8">{result.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                       <div>
                         <h4 className="text-[10px] font-mono text-accent uppercase tracking-widest mb-4">Implementation_Steps</h4>
                         <div className="space-y-4">
                           {result.steps.slice(0, 4).map((step, i) => (
                             <div key={i} className="flex gap-3">
                               <span className="text-accent font-mono text-[10px] pt-1">{i+1}.</span>
                               <p className="text-xs text-zinc-300 leading-relaxed">{step}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                       <div>
                         <h4 className="text-[10px] font-mono text-accent uppercase tracking-widest mb-4">Tech_Stack</h4>
                         <div className="flex flex-wrap gap-2">
                           {result.stack.map(s => (
                             <span key={s} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-white">{s}</span>
                           ))}
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/builder', { state: result })}
                      className="flex-1 py-4 bg-accent text-black font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-accent/20"
                    >
                      Construct_Project <ArrowRight size={18} />
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>

                {/* Right Column: Files */}
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-fit">
                   <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-mono text-accent uppercase tracking-widest">Blueprint_Files</h4>
                      <button onClick={() => setExpandedFiles(!expandedFiles)}>
                        {expandedFiles ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
                      </button>
                   </div>
                   <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {result.files.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors group">
                           {file.endsWith('/') ? <Folder size={14} className="text-accent" /> : <FileCode size={14} className="text-zinc-600 group-hover:text-zinc-400" />}
                           <span className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200 truncate">{file}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Decorative Title (Ambient) */}
      {!result && !isGenerating && (
         <div className="absolute bottom-12 left-12 pointer-events-none opacity-20">
            <h1 className="text-8xl font-black uppercase tracking-tighter text-white select-none">FORGE</h1>
         </div>
      )}
    </div>
  );
}
