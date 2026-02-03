import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useBlueprintContext } from '../contexts/BlueprintContext';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  idx: number;
}

const ProjectCard = ({ project, idx }: ProjectCardProps) => {
  const { blueprint, setHoverMeta } = useBlueprintContext();
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <Link 
      to={`/works/${project.slug}`}
      className={`${idx % 3 === 0 ? 'md:col-span-12 lg:col-span-8' : 'md:col-span-6 lg:col-span-4'} group`}
      onMouseEnter={() => {
        const bounds = cardRef.current?.getBoundingClientRect();
        if (bounds) {
          setHoverMeta({
            name: `<ProjectCard id={${project.id}} />`,
            bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
            props: `idx: ${idx}, theme: ${idx % 3 === 0 ? 'wide' : 'standard'}`,
            targetX: bounds.left + bounds.width / 2,
            targetY: bounds.top + bounds.height / 2
          });
        }
      }}
      onMouseLeave={() => setHoverMeta(null)}
    >
      <div ref={cardRef} className={`overflow-hidden rounded-3xl bg-zinc-900 relative ${idx % 3 === 0 ? 'aspect-video' : 'aspect-[4/5]'} border border-white/5`}>
        <img src={project.image} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" alt="" />
        {blueprint && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-full h-px bg-accent/20 absolute top-1/2" />
            <div className="h-full w-px bg-accent/20 absolute left-1/2" />
            <p className="font-mono text-[8px] text-accent bg-black px-2 py-1">RAW_ASSET_{project.id}</p>
          </div>
        )}
        <div className="absolute top-8 right-8 w-14 h-14 bg-accent rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 shadow-2xl">
          <ArrowUpRight className="text-black" size={24} />
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">{project.title}</h3>
          <span className="font-mono text-xs text-zinc-500">{project.year}</span>
        </div>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em]">{project.category}</p>
      </div>
    </Link>
  );
};

const Works = () => {
  const projects = useQuery(api.projects.get);
  
  if (!projects) return <div className="pt-48 pb-24 px-6 min-h-screen flex items-center justify-center font-mono uppercase text-accent">Accessing_Archives...</div>;

  return (
    <div className="pt-48 pb-24 px-6 min-h-screen">
      <div className="container mx-auto">
        <h1 className="text-7xl md:text-[10vw] font-black uppercase tracking-tighter leading-none mb-32">Legacy</h1>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-32">
          {projects.map((project, idx) => (
            <ProjectCard key={project._id} project={project as any} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Works;
