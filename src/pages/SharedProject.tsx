import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Github, ExternalLink, Calendar, User, Layers, Eye, Zap } from 'lucide-react';
import { api } from '../../convex/_generated/api';

const SharedProject = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = useQuery(api.user_projects.getBySlug, slug ? { slug } : "skip");
  const incrementViews = useMutation(api.user_projects.incrementViews);
  const hasIncremented = useRef(false);

  // Increment view count only once per mount
  useEffect(() => {
    if (slug && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementViews({ slug });
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (project === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Zap size={40} className="animate-pulse text-accent mx-auto mb-4" />
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            Loading_Project_Data...
          </p>
        </div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">
            404
          </h1>
          <p className="font-mono text-sm text-zinc-500 uppercase mb-8">
            Project_Not_Found
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-bold uppercase tracking-widest rounded-full"
          >
            Return_Home
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Check visibility
  if (project.visibility === 'private') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
            Access_Denied
          </h1>
          <p className="font-mono text-sm text-zinc-500 uppercase">
            This project is private
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Image */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="inline-block px-3 py-1 bg-accent/10 border border-accent/30 rounded-full font-mono text-[10px] text-accent uppercase tracking-widest mb-4">
                {project.category}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
                {project.title.split(' ')[0]}
                {project.title.split(' ').length > 1 && (
                  <><br /><span className="text-outline italic">{project.title.split(' ').slice(1).join(' ')}</span></>
                )}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="container mx-auto max-w-5xl px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="font-mono text-[10px] text-accent uppercase tracking-widest mb-4">
                Project_Overview
              </h2>
              <p className="text-lg text-zinc-300 leading-relaxed">
                {project.description}
              </p>
            </motion.div>

            {/* Tech Stack */}
            {project.stack.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="font-mono text-[10px] text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers size={12} />
                  Tech_Stack
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech: string) => (
                    <span
                      key={tech}
                      className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-full font-mono text-xs uppercase"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Links */}
            {(project.liveUrl || project.githubUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex gap-4"
              >
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-accent text-black font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                  >
                    <ExternalLink size={16} />
                    View_Live
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 border border-white/20 font-bold uppercase tracking-widest rounded-full hover:border-accent hover:text-accent transition-all"
                  >
                    <Github size={16} />
                    Source_Code
                  </a>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-4">
              {project.clientName && (
                <div>
                  <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <User size={10} />
                    Client
                  </p>
                  <p className="font-bold">{project.clientName}</p>
                </div>
              )}
              {project.role && (
                <div>
                  <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest mb-1">
                    Role
                  </p>
                  <p className="font-bold">{project.role}</p>
                </div>
              )}
              <div>
                <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Calendar size={10} />
                  Year
                </p>
                <p className="font-bold">{project.year}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Eye size={10} />
                  Views
                </p>
                <p className="font-bold">{project.viewCount + 1}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 text-center">
              <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">
                Create_Your_Own
              </p>
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-bold uppercase tracking-widest rounded-full text-sm"
              >
                Start_Building
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SharedProject;
