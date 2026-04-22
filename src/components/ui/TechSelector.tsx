import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface TechSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  presets: string[];
  label?: string;
  maxHeight?: string;
}

const TechSelector = ({
  selected,
  onChange,
  presets,
  label = 'Selected_Stack',
  maxHeight = '200px',
}: TechSelectorProps) => {
  const [customInput, setCustomInput] = useState('');

  const addTech = (tech: string) => {
    if (!selected.includes(tech)) {
      onChange([...selected, tech]);
    }
  };

  const removeTech = (tech: string) => {
    onChange(selected.filter((t) => t !== tech));
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim() && !selected.includes(customInput.trim())) {
      onChange([...selected, customInput.trim()]);
      setCustomInput('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block">
          {label} ({selected.length})
        </label>
        <div className="min-h-[50px] p-4 border border-white/10 rounded-xl bg-white/[0.02] flex flex-wrap gap-2">
          {selected.length === 0 ? (
            <span className="text-zinc-600 font-mono text-xs uppercase">No_Modules_Selected</span>
          ) : (
            selected.map((tech) => (
              <motion.span
                key={tech}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-accent font-mono text-xs uppercase"
              >
                {tech}
                <button
                  onClick={() => removeTech(tech)}
                  aria-label={`Remove ${tech}`}
                  className="hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </motion.span>
            ))
          )}
        </div>
      </div>

      <form onSubmit={handleCustomAdd} className="space-y-2">
        <label htmlFor="custom-module-input" className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.3em] block">
          Add_Custom_Module
        </label>
        <div className="flex gap-2">
          <input
            id="custom-module-input"
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="TYPE_MODULE_NAME"
            className="flex-1 bg-transparent border-b-2 border-white/10 focus:border-accent py-2 outline-none font-mono text-sm uppercase placeholder:text-zinc-700 transition-colors"
          />
          <button
            type="submit"
            aria-label="Add custom module"
            className="w-10 h-10 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-black transition-all"
          >
            <Plus size={16} />
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.3em] block">
          Quick_Select
        </label>
        <div className="flex flex-wrap gap-2 overflow-y-auto no-scrollbar" style={{ maxHeight }}>
          {presets.filter((tech) => !selected.includes(tech)).map((tech) => (
            <button
              key={tech}
              onClick={() => addTech(tech)}
              className="px-3 py-1.5 border border-white/10 rounded-full font-mono text-[10px] uppercase text-zinc-400 hover:border-accent hover:text-accent transition-all"
            >
              {tech}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechSelector;
