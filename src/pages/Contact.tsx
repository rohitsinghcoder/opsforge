import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Mail, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const CONTACT_DETAILS = [
  { icon: Mail, label: 'Email', value: 'hello@echo.studio', href: 'mailto:hello@echo.studio' },
  { icon: MapPin, label: 'Location', value: 'Remote // Worldwide', href: null },
  { icon: Clock, label: 'Response', value: 'Within 24 hours', href: null },
];

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Twitter / X', href: 'https://x.com' },
];

const Contact = () => {
  usePageTitle('Contact');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!formData.email.trim()) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = 'Invalid email format';
    if (!formData.message.trim()) nextErrors.message = 'Message is required';
    else if (formData.message.trim().length < 10) nextErrors.message = 'Message must be at least 10 characters';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-mono text-[10px] text-accent uppercase tracking-[0.4em] mb-4 md:mb-6">
              Get_In_Touch
            </p>
            <h1 className="text-6xl md:text-8xl lg:text-[10vw] font-black uppercase tracking-tighter leading-[0.85]">
              Let's<br />Talk
            </h1>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-px bg-gradient-to-r from-accent/40 via-white/10 to-transparent mt-8 md:mt-12 origin-left"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
          {/* Left column — info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="lg:col-span-4 space-y-12"
          >
            {/* Contact details */}
            <div className="space-y-6">
              <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em]">Details</p>
              {CONTACT_DETAILS.map((item) => (
                <div key={item.label} className="group flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-white/[0.06] bg-white/[0.02] flex items-center justify-center shrink-0 group-hover:border-accent/20 transition-colors">
                    <item.icon size={16} className="text-zinc-500 group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm font-bold text-white hover:text-accent transition-colors break-all"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-bold text-white">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.04]" />

            {/* Socials */}
            <div className="space-y-4">
              <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em]">Elsewhere</p>
              <div className="flex flex-wrap gap-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] hover:border-accent/25 bg-white/[0.02] hover:bg-accent/[0.03] font-mono text-[10px] text-zinc-400 hover:text-accent uppercase tracking-[0.15em] transition-all duration-300"
                  >
                    {s.label}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>

            {/* Availability badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-[0.15em]">
                Available for projects
              </span>
            </div>
          </motion.div>

          {/* Right column — form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="lg:col-span-8"
          >
            <div className="bg-white/[0.02] p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-3xl border border-white/[0.06] relative overflow-hidden">
              {/* Subtle corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/[0.04] to-transparent pointer-events-none" />

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 md:py-24 text-center relative"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                      className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(196,255,14,0.2)]"
                    >
                      <Check size={40} className="text-black" />
                    </motion.div>
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3">
                      Message_Sent
                    </h3>
                    <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-10 max-w-xs">
                      Transmission successful — expect a response within 24 hours.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="font-mono text-xs text-accent uppercase tracking-widest hover:underline underline-offset-4 transition-all"
                    >
                      Send_Another →
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8 md:space-y-10 relative"
                    onSubmit={handleSubmit}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                      {/* Name */}
                      <div className="relative">
                        <label className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em] block mb-3">
                          Name
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          required
                          value={formData.name}
                          onFocus={() => setFocused('name')}
                          onBlur={() => setFocused(null)}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, name: e.target.value }));
                            setErrors((prev) => ({ ...prev, name: '' }));
                          }}
                          className={`w-full bg-transparent border-b py-3 focus:outline-none font-bold text-sm transition-colors placeholder:text-zinc-700 ${
                            errors.name
                              ? 'border-red-500'
                              : focused === 'name'
                              ? 'border-accent'
                              : 'border-white/10'
                          }`}
                        />
                        {errors.name && (
                          <p className="font-mono text-[10px] text-red-400 mt-2">{errors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="relative">
                        <label className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em] block mb-3">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          required
                          value={formData.email}
                          onFocus={() => setFocused('email')}
                          onBlur={() => setFocused(null)}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, email: e.target.value }));
                            setErrors((prev) => ({ ...prev, email: '' }));
                          }}
                          className={`w-full bg-transparent border-b py-3 focus:outline-none font-bold text-sm transition-colors placeholder:text-zinc-700 ${
                            errors.email
                              ? 'border-red-500'
                              : focused === 'email'
                              ? 'border-accent'
                              : 'border-white/10'
                          }`}
                        />
                        {errors.email && (
                          <p className="font-mono text-[10px] text-red-400 mt-2">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="relative">
                      <label className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em] block mb-3">
                        Message
                      </label>
                      <textarea
                        placeholder="Tell me about your project..."
                        rows={5}
                        required
                        value={formData.message}
                        onFocus={() => setFocused('message')}
                        onBlur={() => setFocused(null)}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, message: e.target.value }));
                          setErrors((prev) => ({ ...prev, message: '' }));
                        }}
                        className={`w-full bg-transparent border-b py-3 focus:outline-none font-bold resize-none text-sm transition-colors placeholder:text-zinc-700 ${
                          errors.message
                            ? 'border-red-500'
                            : focused === 'message'
                            ? 'border-accent'
                            : 'border-white/10'
                        }`}
                      />
                      {errors.message && (
                        <p className="font-mono text-[10px] text-red-400 mt-2">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group w-full py-5 md:py-6 bg-accent text-black font-black uppercase tracking-widest rounded-xl md:rounded-2xl text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 hover:shadow-[0_0_40px_rgba(196,255,14,0.15)]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Transmitting...
                        </>
                      ) : (
                        <>
                          Send Message
                          <ArrowUpRight
                            size={16}
                            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                          />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
