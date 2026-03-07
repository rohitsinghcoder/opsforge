import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    else if (formData.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
        <div>
          <h1 className="text-6xl md:text-8xl lg:text-[10vw] font-black uppercase tracking-tighter mb-8 md:mb-12">Talk</h1>
          <a href="mailto:hello@echo.studio" className="text-lg md:text-2xl font-bold text-accent break-all hover:underline underline-offset-4 transition-colors">
            hello@echo.studio
          </a>
        </div>
        <div className="bg-white/5 p-6 md:p-12 rounded-2xl md:rounded-[2rem] border border-white/10">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-6"
                >
                  <Check size={40} className="text-black" />
                </motion.div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Message_Sent</h3>
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-8">Transmission successful — expect a response soon.</p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="font-mono text-xs text-accent uppercase tracking-widest hover:underline"
                >
                  Send_Another
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 md:space-y-10"
                onSubmit={handleSubmit}
              >
                <div>
                  <input
                    type="text"
                    placeholder="NAME"
                    required
                    value={formData.name}
                    onChange={e => { setFormData(prev => ({ ...prev, name: e.target.value })); setErrors(prev => ({ ...prev, name: '' })); }}
                    className={`w-full bg-transparent border-b py-3 md:py-4 focus:outline-none font-black uppercase tracking-widest text-sm md:text-base transition-colors ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-accent'}`}
                  />
                  {errors.name && <p className="font-mono text-[11px] text-red-400 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="EMAIL"
                    required
                    value={formData.email}
                    onChange={e => { setFormData(prev => ({ ...prev, email: e.target.value })); setErrors(prev => ({ ...prev, email: '' })); }}
                    className={`w-full bg-transparent border-b py-3 md:py-4 focus:outline-none font-black uppercase tracking-widest text-sm md:text-base transition-colors ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-accent'}`}
                  />
                  {errors.email && <p className="font-mono text-[11px] text-red-400 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <textarea
                    placeholder="MESSAGE"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={e => { setFormData(prev => ({ ...prev, message: e.target.value })); setErrors(prev => ({ ...prev, message: '' })); }}
                    className={`w-full bg-transparent border-b py-3 md:py-4 focus:outline-none font-black uppercase tracking-widest resize-none text-sm md:text-base transition-colors ${errors.message ? 'border-red-500' : 'border-white/10 focus:border-accent'}`}
                  />
                  {errors.message && <p className="font-mono text-[11px] text-red-400 mt-1">{errors.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 md:py-6 bg-accent text-black font-black uppercase tracking-widest rounded-xl md:rounded-2xl text-sm md:text-base active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Transmitting...</>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Contact;
