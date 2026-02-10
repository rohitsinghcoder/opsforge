const Contact = () => (
  <div className="pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen">
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
      <div>
        <h1 className="text-6xl md:text-8xl lg:text-[10vw] font-black uppercase tracking-tighter mb-8 md:mb-12">Talk</h1>
        <p className="text-lg md:text-2xl font-bold text-accent break-all">hello@echo.studio</p>
      </div>
      <div className="bg-white/5 p-6 md:p-12 rounded-2xl md:rounded-[2rem] border border-white/10">
        <form className="space-y-6 md:space-y-10" onSubmit={e => e.preventDefault()}>
          <input type="text" placeholder="NAME" className="w-full bg-transparent border-b border-white/10 py-3 md:py-4 focus:outline-none focus:border-accent font-black uppercase tracking-widest text-sm md:text-base" />
          <input type="email" placeholder="EMAIL" className="w-full bg-transparent border-b border-white/10 py-3 md:py-4 focus:outline-none focus:border-accent font-black uppercase tracking-widest text-sm md:text-base" />
          <textarea placeholder="MESSAGE" rows={4} className="w-full bg-transparent border-b border-white/10 py-3 md:py-4 focus:outline-none focus:border-accent font-black uppercase tracking-widest resize-none text-sm md:text-base" />
          <button className="w-full py-4 md:py-6 bg-accent text-black font-black uppercase tracking-widest rounded-xl md:rounded-2xl text-sm md:text-base active:scale-95 transition-transform">Send Message</button>
        </form>
      </div>
    </div>
  </div>
);

export default Contact;
