import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Cpu, Activity, ArrowUpRight, Plus } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useBlueprintContext } from '../contexts/BlueprintContext';
import type { Project } from '../data/projects';

const ProjectVault = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const { setHoverMeta } = useBlueprintContext();
  const [explorerProject, setExplorerProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'stack' | 'palette' | 'data'>('stack');

  const projects = useQuery(api.projects.get);

  useEffect(() => {
    const container = scrollRef.current;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setMousePos({ x, y });
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    };

    const autoScroll = () => {
      if (!container || explorerProject) return; // Stop scroll when explorer is open
      
      const { x } = mouseRef.current;
      const edgeSize = window.innerWidth * 0.12;
      const speed = 25;

      if (x > window.innerWidth - edgeSize) {
        const intensity = (x - (window.innerWidth - edgeSize)) / edgeSize;
        container.scrollLeft += speed * Math.pow(intensity, 2);
      } else if (x < edgeSize) {
        const intensity = (edgeSize - x) / edgeSize;
        container.scrollLeft -= speed * Math.pow(intensity, 2);
      }
      
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(container.scrollLeft / maxScroll);
      }
      
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    const handleScroll = () => {
      if (!container) return;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(container.scrollLeft / maxScroll);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    container?.addEventListener('scroll', handleScroll);
    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      container?.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [explorerProject, projects]);

  if (!projects) return (
    <div className="h-screen w-full bg-[#080808] flex items-center justify-center font-mono text-accent">
      <div className="flex flex-col items-center gap-4">
        <Zap className="animate-pulse" size={40} />
        <p className="tracking-[0.5em] uppercase text-[10px]">Mapping_Project_Nodes...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#080808] overflow-hidden relative selection:bg-accent selection:text-black">

      {/* Liquid Background Text */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5 select-none">
        <motion.h1 
          style={{ x: mousePos.x * -150, y: mousePos.y * -80 }}
          className="text-[40vw] font-black uppercase text-white leading-none whitespace-nowrap italic"
        >
          Project_Nodes
        </motion.h1>
      </div>

      {/* Navigation HUD */}
      <nav className="fixed top-0 w-full z-50 p-10 flex justify-between items-center mix-blend-difference">
        <button onClick={() => navigate('/')} className="font-mono text-xs tracking-[0.5em] uppercase hover:text-accent transition-colors">
          [ Back_To_Core ]
        </button>
        <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Push_Edges_To_Scroll_Fast
        </div>
      </nav>

      {/* Horizontal Scroll Area */}
      <div 
        ref={scrollRef}
        className="h-full flex items-center gap-20 px-[15vw] overflow-x-auto no-scrollbar"
      >
        {projects.map((project) => (
          <motion.div 
            key={project._id}
            whileHover={{ y: -20 }}
            onClick={() => setExplorerProject(project as any)}
            onMouseEnter={(e) => {
              const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setHoverMeta({
                name: `<ProjectNode id={${project.id}} />`,
                bounds: `${Math.round(bounds.width)}px x ${Math.round(bounds.height)}px`,
                props: `status: decrypted, year: ${project.year}`,
                targetX: bounds.left + bounds.width / 2,
                targetY: bounds.top + bounds.height / 2
              });
            }}
            onMouseLeave={() => setHoverMeta(null)}
            className="flex-shrink-0 group cursor-pointer"
          >
            <div className="relative w-[70vw] md:w-[35vw] aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/5 bg-zinc-900/30 backdrop-blur-3xl shadow-2xl">
              {/* Image with Tilt Effect */}
              <motion.div 
                style={{ scale: 1.1 }}
                whileHover={{ scale: 1.15, x: mousePos.x * 30, y: mousePos.y * 30 }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
                className="w-full h-full"
              >
                <img src={project.image} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-40 group-hover:opacity-100" />
              </motion.div>

              {/* Overlay Data */}
              <div className="absolute inset-0 p-12 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] text-accent font-bold uppercase block tracking-tighter">
                      Node_Access_0{project.id}
                    </span>
                    <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Status: Decrypted</p>
                  </div>
                  <p className="font-mono text-[10px] text-zinc-500">{project.year}</p>
                </div>
                
                <div>
                  <h3 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-6 group-hover:italic transition-all">
                    {project.title.split(' ')[0]} <br />
                    <span className="text-outline">{project.title.split(' ')[1]}</span>
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-px bg-accent/30" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                      {project.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        <div className="w-[30vw] flex-shrink-0" />
      </div>

      {/* File Explorer Modal */}
      <AnimatePresence>
        {explorerProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setExplorerProject(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Window Header */}
              <div className="bg-zinc-900/50 px-6 py-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest ml-4">
                    Directory: root/projects/{explorerProject.title.toLowerCase().replace(' ', '_')}
                  </span>
                </div>
                <button onClick={() => setExplorerProject(null)} className="text-zinc-500 hover:text-white transition-colors">
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 h-[50vh]">
                {/* Sidebar */}
                <div className="border-r border-white/5 p-6 space-y-6">
                  <div className="space-y-2">
                    <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Files</p>
                    {[
                      { id: 'stack', label: 'stack.log', icon: Cpu },
                      { id: 'palette', label: 'colors.cfg', icon: Activity },
                      { id: 'data', label: 'manifest.json', icon: Zap },
                    ].map(file => (
                      <button 
                        key={file.id}
                        onClick={() => setActiveTab(file.id as any)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeTab === file.id ? 'bg-accent/10 text-accent' : 'text-zinc-500 hover:bg-white/5'}`}
                      >
                        <file.icon size={14} />
                        <span className="font-mono text-[10px] uppercase">{file.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 p-8 font-mono overflow-y-auto no-scrollbar">
                  {activeTab === 'stack' && (
                    <div className="space-y-4">
                      <p className="text-accent text-xs">{" >> "}ANALYZING_SYSTEM_ARCHITECTURE...</p>
                      <div className="grid grid-cols-2 gap-4">
                        {['React 19.0', 'TypeScript 5.0', 'Three.js', 'Framer Motion', 'Tailwind CSS'].map(tech => (
                          <div key={tech} className="p-4 border border-white/5 rounded-xl bg-white/[0.02]">
                            <p className="text-[10px] text-zinc-500 uppercase mb-1">Module</p>
                            <p className="text-sm text-white font-bold">{tech}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === 'palette' && (
                    <div className="space-y-6">
                      <p className="text-accent text-xs">{" >> "}EXTRACTING_COLOR_CHANNELS...</p>
                      <div className="space-y-4">
                        {[
                          { name: 'Core_Accent', hex: '#C4FF0E', use: 'Primary UI' },
                          { name: 'Deep_Void', hex: '#050505', use: 'Background' },
                          { name: 'Neural_Zinc', hex: '#71717A', use: 'Metadata' },
                        ].map(color => (
                          <div key={color.hex} className="flex items-center gap-6 group">
                            <div className="w-12 h-12 rounded-xl border border-white/10" style={{ backgroundColor: color.hex }} />
                            <div>
                              <p className="text-white text-xs font-bold uppercase">{color.name}</p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{color.hex} // {color.use}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === 'data' && (
                    <div className="space-y-4">
                      <p className="text-accent text-xs">{" >> "}READING_PROJECT_MANIFEST...</p>
                      <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 text-[10px] text-zinc-400 leading-relaxed">
                        <pre className="whitespace-pre-wrap">
                          {`{
  "project_id": "${explorerProject.id}",
  "client": "${explorerProject.client}",
  "release_year": "${explorerProject.year}",
  "classification": "${explorerProject.category}",
  "status": "COMPLETED",
  "data_integrity": 1.0,
  "encrypted": false
}`}
                        </pre>
                      </div>
                      <Link 
                        to={`/works/${explorerProject.slug}`}
                        className="flex items-center justify-between p-4 rounded-xl border border-accent/30 hover:bg-accent/10 transition-colors group"
                      >
                        <span className="font-mono text-[10px] text-accent uppercase tracking-widest">Open_Full_Case_Study</span>
                        <ArrowUpRight size={14} className="text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Progress HUD */}
      <div className="fixed bottom-12 left-12 right-12 flex justify-between items-center z-50">
        <div className="flex items-center gap-8">
          <div className="w-64 h-[2px] bg-white/5 relative overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-accent origin-left" 
              style={{ scaleX: scrollProgress }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <p className="font-mono text-[9px] text-accent uppercase tracking-[0.3em]">
            {Math.round(scrollProgress * 100)}%_Mapped
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-mono text-[8px] text-zinc-600 uppercase">Input_Method</p>
            <p className="font-mono text-[10px] text-white uppercase tracking-widest italic">Edge_Trigger_Active</p>
          </div>
          <div className="w-12 h-12 rounded-full border border-accent/20 flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-accent rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectVault;
