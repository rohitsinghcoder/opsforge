import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Loader2, ChevronRight, ChevronDown, 
  Folder, FileCode, ArrowRight, RefreshCw, Zap, X, Plus
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { getOrCreateClientId } from '../utils/clientIdentity';

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
  'React', 'TypeScript', 'JavaScript', 'Next.js', 'Vue', 'Angular', 'Svelte',
  'Node.js', 'Python', 'Go', 'Rust', 'Java',
  'Tailwind CSS', 'Three.js', 'WebGL', 'Framer Motion',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
  'AWS', 'Docker', 'Kubernetes',
  'React Native', 'Flutter', 'Swift', 'Kotlin',
  'TensorFlow', 'PyTorch', 'OpenAI API',
];

const CATEGORIES = [
  { value: '', label: 'Any Category' },
  { value: 'Web App', label: 'Web App' },
  { value: 'Mobile App', label: 'Mobile App' },
  { value: 'CLI Tool', label: 'CLI Tool' },
  { value: 'API/Backend', label: 'API/Backend' },
  { value: 'AI/ML Project', label: 'AI/ML Project' },
  { value: 'Browser Extension', label: 'Browser Extension' },
  { value: 'Game', label: 'Game' },
  { value: 'Developer Tool', label: 'Developer Tool' },
];

const IdeaGenerator = () => {
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [complexity, setComplexity] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [category, setCategory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ProjectIdea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState(true);
  const [clientId] = useState(() => getOrCreateClientId());
  const generateProjectIdea = useAction(api.ai.generateProjectIdea);

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleGenerate = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    const response = await generateProjectIdea({
      skills: selectedSkills,
      complexity,
      category: category || undefined,
      clientId,
    });

    if (typeof response === 'string') {
      setError(response);
    } else {
      setResult(response);
    }

    setIsGenerating(false);
  };

  const handleUseInBuilder = () => {
    if (!result) return;
    
    // Store the idea in sessionStorage to prefill builder
    sessionStorage.setItem('builderPrefill', JSON.stringify({
      title: result.title,
      category: result.category,
      description: result.description,
      stack: result.stack,
    }));
    
    navigate('/builder');
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full mb-6">
            <Sparkles size={16} className="text-accent" />
            <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
              AI_Powered
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Project <span className="text-outline italic">Ideas</span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Tell us your skills, and we'll generate a unique project idea with file structure and implementation steps.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8 mb-8"
        >
          {/* Selected Skills */}
          <div className="mb-6">
            <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block mb-3">
              Your_Skills ({selectedSkills.length} selected)
            </label>
            <div className="min-h-[50px] p-4 border border-white/10 rounded-xl bg-black/30 flex flex-wrap gap-2 mb-4">
              {selectedSkills.length === 0 ? (
                <span className="text-zinc-600 font-mono text-xs">Select skills below...</span>
              ) : (
                selectedSkills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-accent font-mono text-xs uppercase"
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-red-400">
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Custom Skill Input */}
            <form onSubmit={handleCustomSkill} className="flex gap-2 mb-4">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Add custom skill..."
                className="flex-1 bg-transparent border-b border-white/10 focus:border-accent py-2 outline-none font-mono text-sm placeholder:text-zinc-700"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-black transition-all"
              >
                <Plus size={14} />
              </button>
            </form>

            {/* Preset Skills */}
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto no-scrollbar">
              {PRESET_SKILLS.filter(s => !selectedSkills.includes(s)).map(skill => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="px-3 py-1 border border-white/10 rounded-full font-mono text-[10px] text-zinc-500 hover:border-accent hover:text-accent transition-all"
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Complexity & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block mb-3">
                Complexity_Level
              </label>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setComplexity(level)}
                    className={`flex-1 py-3 rounded-xl border font-mono text-xs uppercase transition-all ${
                      complexity === level
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-white/10 text-zinc-500 hover:border-white/30'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block mb-3">
                Category (Optional)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 focus:border-accent rounded-xl px-4 py-3 outline-none font-mono text-sm cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedSkills.length === 0}
            className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
              selectedSkills.length > 0 && !isGenerating
                ? 'bg-accent text-black hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={20} />
                Generate_Idea
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-center font-mono text-sm text-red-400">{error}</p>
          )}
        </motion.div>

        {/* Result Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-zinc-900/50 border border-accent/30 rounded-2xl overflow-hidden"
            >
              {/* Result Header */}
              <div className="p-6 md:p-8 border-b border-white/5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="font-mono text-[10px] text-accent uppercase tracking-widest block mb-2">
                      Generated_Project
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                      {result.title}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-accent/10 border border-accent/30 rounded-full font-mono text-[10px] text-accent uppercase">
                      {result.category}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] text-zinc-400 uppercase">
                      {result.complexity}
                    </span>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed">{result.description}</p>
              </div>

              {/* Tech Stack */}
              <div className="p-6 md:p-8 border-b border-white/5">
                <h3 className="font-mono text-[10px] text-accent uppercase tracking-widest mb-4">
                  Recommended_Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.stack.map(tech => (
                    <span
                      key={tech}
                      className="px-4 py-2 bg-zinc-800 border border-white/10 rounded-full font-mono text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* File Structure */}
              <div className="p-6 md:p-8 border-b border-white/5">
                <button
                  onClick={() => setExpandedFiles(!expandedFiles)}
                  className="flex items-center gap-2 font-mono text-[10px] text-accent uppercase tracking-widest mb-4 hover:text-white transition-colors"
                >
                  {expandedFiles ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  File_Structure ({result.files.length} items)
                </button>
                <AnimatePresence>
                  {expandedFiles && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-black/30 rounded-xl p-4 font-mono text-sm overflow-hidden"
                    >
                      {result.files.map((file, idx) => {
                        const isFolder = file.endsWith('/');
                        const depth = (file.match(/\//g) || []).length;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 py-1 text-zinc-400"
                            style={{ paddingLeft: `${depth * 16}px` }}
                          >
                            {isFolder ? (
                              <Folder size={14} className="text-accent" />
                            ) : (
                              <FileCode size={14} className="text-zinc-600" />
                            )}
                            <span className={isFolder ? 'text-accent' : ''}>{file.replace(/\/$/, '')}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Implementation Steps */}
              <div className="p-6 md:p-8 border-b border-white/5">
                <h3 className="font-mono text-[10px] text-accent uppercase tracking-widest mb-4">
                  Implementation_Steps
                </h3>
                <div className="space-y-3">
                  {result.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center font-mono text-[10px] text-accent shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleUseInBuilder}
                  className="flex-1 py-4 bg-accent text-black font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  Use_In_Builder
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 py-4 border border-white/20 font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-all"
                >
                  <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                  Generate_Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IdeaGenerator;
