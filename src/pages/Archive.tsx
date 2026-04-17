import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { usePageTitle } from '../hooks/usePageTitle';

type PortfolioProject = Doc<'projects'>;

const ArchiveRow = ({ project, idx }: { project: PortfolioProject; idx: number }) => {
  const rowRef = useRef<HTMLAnchorElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: '-50px' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        ref={rowRef}
        to={`/works/${project.slug}`}
        className="group grid grid-cols-1 md:grid-cols-12 items-center py-6 md:py-8 border-b border-white/[0.04] hover:border-white/10 transition-all duration-500 px-2 md:px-4 relative overflow-hidden"
      >
        {/* Hover background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Row number */}
        <div className="col-span-1 relative">
          <span className="font-mono text-[10px] text-zinc-600 group-hover:text-accent/50 transition-colors duration-300">
            {String(idx + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Year */}
        <div className="col-span-1 hidden md:block relative">
          <span className="font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
            {project.year}
          </span>
        </div>

        {/* Title */}
        <div className="col-span-5 relative">
          <h3 className="text-lg md:text-2xl font-bold uppercase tracking-tighter group-hover:text-accent transition-colors duration-300 break-words flex items-center gap-3">
            {project.title}
            <ArrowUpRight
              size={16}
              className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-accent shrink-0"
            />
          </h3>
        </div>

        {/* Client */}
        <div className="col-span-2 hidden md:block relative">
          <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.15em]">
            {project.client}
          </span>
        </div>

        {/* Category tag */}
        <div className="col-span-3 relative text-right hidden md:block">
          <span className="inline-block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600 group-hover:text-zinc-400 transition-colors border border-white/[0.05] group-hover:border-white/10 rounded-full px-3 py-1">
            {project.category}
          </span>
        </div>

        {/* Mobile meta */}
        <div className="flex items-center gap-3 mt-1 md:hidden">
          <span className="font-mono text-[10px] text-zinc-600">{project.year}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="font-mono text-[10px] text-zinc-600 uppercase">{project.category}</span>
        </div>
      </Link>
    </motion.div>
  );
};

const Archive = () => {
  usePageTitle('Archive');
  const projects = useQuery(api.projects.get);

  if (!projects)
    return (
      <div className="pt-48 pb-24 px-6 min-h-screen flex items-center justify-center font-mono uppercase text-accent text-xs tracking-widest">
        <span className="animate-pulse">Accessing_Data_Vault...</span>
      </div>
    );

  return (
    <div className="pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen overflow-x-hidden">
      <div className="container mx-auto max-w-full overflow-hidden">
        {/* Header */}
        <div className="mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-mono text-[10px] text-accent uppercase tracking-[0.4em] mb-4 md:mb-6">
              Complete_Index
            </p>
            <h1 className="text-5xl sm:text-7xl md:text-[10vw] font-black uppercase tracking-tighter leading-[0.85] mb-4">
              Archive
            </h1>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-px bg-gradient-to-r from-accent/40 via-white/10 to-transparent origin-left"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.25em] mt-4"
          >
            {projects.length} entries // sorted by date
          </motion.p>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 items-center border-b border-white/10 px-4 pb-4 mb-2">
          <span className="col-span-1 font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em]">#</span>
          <span className="col-span-1 font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em]">Year</span>
          <span className="col-span-5 font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em]">Project</span>
          <span className="col-span-2 font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em]">Client</span>
          <span className="col-span-3 font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em] text-right">Category</span>
        </div>

        {/* Rows */}
        <div>
          {projects.map((p: PortfolioProject, idx: number) => (
            <ArchiveRow key={p._id} project={p} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Archive;
