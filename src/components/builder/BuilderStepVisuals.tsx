import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Link, Github } from 'lucide-react';

interface Props {
  data: {
    imageUrl: string;
    description: string;
    role: string;
    liveUrl: string;
    githubUrl: string;
  };
  onChange: (field: string, value: string) => void;
}

const BuilderStepVisuals = ({ data, onChange }: Props) => {
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const hasPreviewError = failedPreviewUrl === data.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Image URL */}
      <div className="space-y-2">
        <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] flex items-center gap-2">
          <Image size={12} />
          Cover_Image_URL *
        </label>
        <input
          type="url"
          value={data.imageUrl}
          onChange={(e) => onChange('imageUrl', e.target.value)}
          placeholder="https://unsplash.com/photo/..."
          className="w-full bg-transparent border-b-2 border-white/10 focus:border-accent py-3 outline-none font-mono text-sm placeholder:text-zinc-700 transition-colors"
        />
        <p className="font-mono text-[9px] text-zinc-600 uppercase">
          Tip: Use Unsplash for free high-quality images
        </p>
      </div>

      {/* Image Preview */}
      {data.imageUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl overflow-hidden border border-white/10"
        >
          {hasPreviewError ? (
            <div className="flex h-32 items-center justify-center bg-zinc-950/80">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Preview_Unavailable
              </p>
            </div>
          ) : (
            <img
              src={data.imageUrl}
              alt="Preview"
              className="w-full h-32 object-cover"
              onError={() => setFailedPreviewUrl(data.imageUrl)}
              onLoad={() => setFailedPreviewUrl((current) => (current === data.imageUrl ? null : current))}
            />
          )}
        </motion.div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block">
          Project_Description *
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe what makes this project special..."
          rows={4}
          className="w-full bg-zinc-900/50 border border-white/10 focus:border-accent rounded-xl px-4 py-3 outline-none font-mono text-sm placeholder:text-zinc-700 transition-colors resize-none"
        />
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.3em] block">
          Your_Role
        </label>
        <input
          type="text"
          value={data.role}
          onChange={(e) => onChange('role', e.target.value)}
          placeholder="Lead Developer, Designer, etc."
          className="w-full bg-transparent border-b-2 border-white/10 focus:border-accent py-2 outline-none font-mono text-sm uppercase placeholder:text-zinc-700 transition-colors"
        />
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Link size={12} />
            Live_URL
          </label>
          <input
            type="url"
            value={data.liveUrl}
            onChange={(e) => onChange('liveUrl', e.target.value)}
            placeholder="https://..."
            className="w-full bg-transparent border-b-2 border-white/10 focus:border-accent py-2 outline-none font-mono text-xs placeholder:text-zinc-700 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Github size={12} />
            GitHub_URL
          </label>
          <input
            type="url"
            value={data.githubUrl}
            onChange={(e) => onChange('githubUrl', e.target.value)}
            placeholder="https://github.com/..."
            className="w-full bg-transparent border-b-2 border-white/10 focus:border-accent py-2 outline-none font-mono text-xs placeholder:text-zinc-700 transition-colors"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default BuilderStepVisuals;
