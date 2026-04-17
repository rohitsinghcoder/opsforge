import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useBlueprintContext } from '../contexts/BlueprintContext';
import { usePageTitle } from '../hooks/usePageTitle';

const ProjectDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { blueprint, setHoverMeta } = useBlueprintContext();

  const project = useQuery(api.projects.getBySlug, { slug: slug || '' });
  usePageTitle(project?.title);

  const blueprintCoords = useMemo(() => {
    const str = slug || 'default';
    let hash = 0;
    for (let index = 0; index < str.length; index += 1) {
      hash = ((hash << 5) - hash + str.charCodeAt(index)) | 0;
    }
    const x = ((Math.abs(hash) % 10000) / 10000).toFixed(4);
    const y = ((Math.abs((hash * 2654435761) | 0) % 10000) / 10000).toFixed(4);
    return { x, y };
  }, [slug]);

  if (project === undefined) {
    return (
      <div className="h-screen flex items-center justify-center font-mono uppercase text-accent gap-3">
        <Zap className="animate-pulse" size={16} />
        Deciphering_Node_Data...
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="h-screen flex items-center justify-center font-mono uppercase text-red-500">
        Node_Not_Found_404
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-16">
          <button
            onClick={() => navigate('/works')}
            className="group flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back_to_Works
          </button>
          <div className="font-mono text-[10px] text-accent uppercase tracking-widest border border-accent/20 px-3 py-1 rounded-full">
            {blueprint ? 'VIEW: SCHEMATIC_OVERLAY' : 'VIEW: FINAL_RENDER'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-32">
          <div className="lg:col-span-8">
            <h1 className="text-7xl md:text-[8vw] font-black uppercase tracking-tighter leading-none mb-8">
              {project.title.split(' ')[0]}
              {project.title.split(' ').length > 1 && (
                <>
                  <br />
                  <span className="text-outline">{project.title.split(' ').slice(1).join(' ')}</span>
                </>
              )}
            </h1>
            <div className="flex gap-4">
              {project.stack.map((tech: string) => (
                <span key={tech} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[9px] text-zinc-400 uppercase tracking-widest">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-end space-y-8">
            <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
              <div>
                <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Client</p>
                <p className="text-sm font-bold uppercase">{project.client}</p>
              </div>
              <div>
                <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Year</p>
                <p className="text-sm font-bold uppercase">{project.year}</p>
              </div>
              <div className="col-span-2">
                <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Role</p>
                <p className="text-sm font-bold uppercase">{project.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/5 mb-32 group"
          onMouseEnter={(event) => {
            const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
            setHoverMeta({
              name: '<AssetViewport />',
              bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
              props: blueprint ? 'src: wireframe.svg, shader: wireframe' : 'src: render.jpg, shader: standard',
            });
          }}
          onMouseLeave={() => setHoverMeta(null)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={blueprint ? 'wireframe' : 'image'}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'circOut' }}
              src={blueprint ? project.wireframe : project.image}
              alt={project.title}
              className={`w-full h-full object-cover ${blueprint ? 'grayscale invert brightness-50 opacity-40' : ''}`}
            />
          </AnimatePresence>

          {blueprint && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-accent/20" />
              <div className="absolute top-0 left-1/2 w-[1px] h-full bg-accent/20" />
              <div className="absolute inset-0 border border-accent/10 m-10" />
              <div className="absolute bottom-10 right-10 font-mono text-[9px] text-accent flex flex-col items-end gap-1">
                <span>COORD_X: {blueprintCoords.x}</span>
                <span>COORD_Y: {blueprintCoords.y}</span>
                <span>MESH_DENSITY: 0.84</span>
              </div>
            </div>
          )}

          <AnimatePresence>
            {blueprint && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-[20%] left-[30%] pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    <div className="bg-black/80 backdrop-blur-md border border-accent/40 p-2 font-mono text-[8px] text-accent uppercase">
                      UI_NODE_PRIMARY_CONTAINER
                    </div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="absolute bottom-[40%] right-[25%] pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="bg-black/80 backdrop-blur-md border border-accent/40 p-2 font-mono text-[8px] text-accent uppercase">
                      ASSET_BUFFER_ZONE_04
                    </div>
                    <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-6">{' >> '}Execution_Summary</p>
          </div>
          <div className="md:col-span-8">
            <p className="text-2xl md:text-3xl font-medium text-zinc-300 leading-relaxed mb-12">
              {project.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                <h4 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Category</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {project.category} - crafted by {project.client} with a focus on {project.stack[0]} and {project.stack.length > 1 ? project.stack[1] : 'modern workflows'}.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                <h4 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Stack</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Built with {project.stack.join(', ')} to deliver a high-fidelity, production-ready digital experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
