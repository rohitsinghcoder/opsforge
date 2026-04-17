import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { useBlueprintContext } from '../contexts/BlueprintContext';
import { usePageTitle } from '../hooks/usePageTitle';

type PortfolioProject = Doc<'projects'>;

interface ProjectCardProps {
  project: PortfolioProject;
  idx: number;
  total: number;
}

const ProjectCard = ({ project, idx, total }: ProjectCardProps) => {
  const { blueprint, setHoverMeta } = useBlueprintContext();
  const cardRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef<HTMLAnchorElement>(null);
  const isInView = useInView(inViewRef, { once: true, margin: '-100px' });

  const isWide = idx % 3 === 0;

  return (
    <motion.div
      className={`${isWide ? 'md:col-span-12 lg:col-span-8' : 'md:col-span-6 lg:col-span-4'}`}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        ref={inViewRef}
        to={`/works/${project.slug}`}
        className="group block"
        onMouseEnter={() => {
          const bounds = cardRef.current?.getBoundingClientRect();
          if (bounds) {
            setHoverMeta({
              name: `<ProjectCard id={${project.id}} />`,
              bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
              props: `idx: ${idx}, theme: ${isWide ? 'wide' : 'standard'}`,
              targetX: bounds.left + bounds.width / 2,
              targetY: bounds.top + bounds.height / 2,
            });
          }
        }}
        onMouseLeave={() => setHoverMeta(null)}
      >
        <div
          ref={cardRef}
          className={`overflow-hidden rounded-2xl md:rounded-3xl relative ${isWide ? 'aspect-video' : 'aspect-[4/5]'} border border-white/5 group-hover:border-white/15 transition-all duration-700`}
        >
          {/* Image */}
          <img
            src={project.image}
            className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-1000 ease-out"
            alt={project.title}
            loading="lazy"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Blueprint crosshair */}
          {blueprint && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-full h-px bg-accent/20 absolute top-1/2" />
              <div className="h-full w-px bg-accent/20 absolute left-1/2" />
              <p className="font-mono text-[8px] text-accent bg-black px-2 py-1">
                RAW_ASSET_{project.id}
              </p>
            </div>
          )}

          {/* Index badge */}
          <div className="absolute top-5 left-5 md:top-8 md:left-8">
            <span className="font-mono text-[10px] text-accent/60 tracking-widest uppercase">
              {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>

          {/* Arrow button */}
          <div className="absolute top-5 right-5 md:top-8 md:right-8 w-11 h-11 md:w-14 md:h-14 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100 group-hover:border-accent/40 group-hover:bg-accent/10">
            <ArrowUpRight className="text-white group-hover:text-accent transition-colors" size={20} />
          </div>

          {/* Bottom info overlay — inside the card */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] text-accent/70 uppercase tracking-[0.3em] mb-2">
                  {project.category}
                </p>
                <h3 className="text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none">
                  {project.title}
                </h3>
              </div>
              <span className="font-mono text-xs text-zinc-500 shrink-0 mb-1">
                {project.year}
              </span>
            </div>
          </div>
        </div>

        {/* Client tag — below the card */}
        {project.client && (
          <div className="mt-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/30" />
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
              {project.client}
            </span>
          </div>
        )}
      </Link>
    </motion.div>
  );
};

const Works = () => {
  usePageTitle('Works');
  const projects = useQuery(api.projects.get);

  if (!projects)
    return (
      <div className="pt-48 pb-24 px-6 min-h-screen flex items-center justify-center font-mono uppercase text-accent text-xs tracking-widest">
        <span className="animate-pulse">Accessing_Archives...</span>
      </div>
    );

  return (
    <div className="pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen">
      <div className="container mx-auto">
        {/* Header section */}
        <div className="mb-20 md:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-mono text-[10px] text-accent uppercase tracking-[0.4em] mb-4 md:mb-6">
              Selected_Projects
            </p>
            <h1 className="text-6xl sm:text-7xl md:text-[10vw] font-black uppercase tracking-tighter leading-[0.85]">
              Works
            </h1>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-px bg-gradient-to-r from-accent/40 via-white/10 to-transparent mt-8 md:mt-12 origin-left"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.25em] mt-4"
          >
            {projects.length} Projects // {new Set(projects.map((p: PortfolioProject) => p.category)).size} Categories
          </motion.p>
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 md:gap-x-12 gap-y-16 md:gap-y-28">
          {projects.map((project: PortfolioProject, idx: number) => (
            <ProjectCard key={project._id} project={project} idx={idx} total={projects.length} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Works;
