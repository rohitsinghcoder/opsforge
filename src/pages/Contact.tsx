const Contact = () => (
  <div className="pt-48 pb-24 px-6 min-h-screen">
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
      <div>
        <h1 className="text-8xl md:text-[10vw] font-black uppercase tracking-tighter mb-12">Talk</h1>
        <p className="text-2xl font-bold text-accent">hello@echo.studio</p>
      </div>
      <div className="bg-white/5 p-12 rounded-[2rem] border border-white/10">
        <form className="space-y-10" onSubmit={e => e.preventDefault()}>
          <input type="text" placeholder="NAME" className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-accent font-black uppercase tracking-widest" />
          <input type="email" placeholder="EMAIL" className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-accent font-black uppercase tracking-widest" />
          <button className="w-full py-6 bg-accent text-black font-black uppercase tracking-widest rounded-2xl">Send Message</button>
        </form>
      </div>
    </div>
  </div>
);

export default Contact;
