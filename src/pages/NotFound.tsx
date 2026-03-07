import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-[20vw] font-black uppercase tracking-tighter leading-none text-accent">404</h1>
      <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest mb-8">Page_Not_Found</p>
      <Link to="/" className="px-8 py-4 bg-accent text-black font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform">
        Return_Home
      </Link>
    </div>
  );
};

export default NotFound;
