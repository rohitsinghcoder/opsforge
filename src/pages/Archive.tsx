import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const Archive = () => {
  const projects = useQuery(api.projects.get);

  useEffect(() => {
    document.title = 'Archive | Echo Studio';
    return () => { document.title = 'Echo Studio | Beyond Digital Bounds'; };
  }, []);

  if (!projects) return <div className="pt-48 pb-24 px-6 min-h-screen flex items-center justify-center font-mono uppercase text-accent">Accessing_Data_Vault...</div>;

  return (
    <div className="pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen overflow-x-hidden">
      <div className="container mx-auto max-w-full overflow-hidden">
        <h1 className="text-5xl sm:text-7xl md:text-[10vw] font-black uppercase tracking-tighter mb-12 md:mb-24 break-words">Archive</h1>
        <div className="border-t border-white/10">
          {projects.map((p) => (
            <Link 
              key={p._id} 
              to={`/works/${p.slug}`}
              className="grid grid-cols-1 md:grid-cols-12 py-6 md:py-10 border-b border-white/5 group hover:bg-white/[0.02] transition-colors px-2 md:px-4"
            >
              <div className="col-span-1 font-mono text-sm text-zinc-500 mb-1 md:mb-0">{p.year}</div>
              <div className="col-span-6">
                <h3 className="text-lg md:text-2xl font-bold uppercase tracking-tighter group-hover:text-accent break-words">
                  {p.client} // {p.title}
                </h3>
              </div>
              <div className="col-span-5 text-right font-mono text-[10px] uppercase text-zinc-600 hidden md:block">{p.category}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Archive;
