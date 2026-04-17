import { useState } from 'react';
import { motion } from 'framer-motion';

interface ProjectData {
  title: string;
  clientName: string;
  year: string;
  category: string;
  stack: string[];
  imageUrl: string;
  description: string;
}

interface Props {
  data: ProjectData;
}

const PreviewCard = ({ data }: Props) => {
  const hasImage = data.imageUrl && data.imageUrl.length > 0;
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const hasImageError = failedImageUrl === data.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl group"
    >
      {/* Background Image */}
      {hasImage && !hasImageError ? (
        <motion.div
          className="absolute inset-0"
          style={{ scale: 1.1 }}
        >
          <img
            src={data.imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-700"
            onError={() => setFailedImageUrl(data.imageUrl)}
            onLoad={() => setFailedImageUrl((current) => (current === data.imageUrl ? null : current))}
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
          <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
            No_Image_Set
          </p>
        </div>
      )}

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-accent font-bold uppercase block tracking-tighter">
              {data.category || 'Category_Not_Set'}
            </span>
            <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
              {data.clientName || 'Client_Not_Set'}
            </p>
          </div>
          <p className="font-mono text-[10px] text-zinc-500">{data.year}</p>
        </div>

        {/* Bottom Section */}
        <div>
          <h3 className="text-4xl font-black uppercase tracking-tighter leading-[0.9] mb-4">
            {data.title ? (
              <>
                {data.title.split(' ')[0] || 'Project'} <br />
                <span className="text-outline italic">
                  {data.title.split(' ').slice(1).join(' ') || 'Title'}
                </span>
              </>
            ) : (
              <>
                Project <br />
                <span className="text-outline italic">Title</span>
              </>
            )}
          </h3>

          {/* Tech Stack Pills */}
          {data.stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {data.stack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 bg-accent/10 border border-accent/30 rounded-full font-mono text-[8px] text-accent uppercase"
                >
                  {tech}
                </span>
              ))}
              {data.stack.length > 4 && (
                <span className="px-2 py-0.5 font-mono text-[8px] text-zinc-500 uppercase">
                  +{data.stack.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Description Preview */}
          {data.description && (
            <p className="font-mono text-[9px] text-zinc-400 mt-4 line-clamp-2 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]" />
      </div>
    </motion.div>
  );
};

export default PreviewCard;
