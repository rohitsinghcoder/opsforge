import { motion } from 'framer-motion';

interface Props {
  data: {
    title: string;
    clientName: string;
    year: string;
    category: string;
  };
  onChange: (field: string, value: string) => void;
}

const CATEGORIES = [
  'Web Development',
  'Mobile App',
  'Brand Identity',
  'UI/UX Design',
  'Design System',
  'Spatial Computing',
  'WebGL/3D',
  'AI/ML',
  'Backend',
  'Full Stack',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, index) => String(currentYear - index));

const BuilderStepIdentity = ({ data, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block">
          Project_Title *
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="ENTER_PROJECT_NAME"
          className="w-full bg-transparent border-b-2 border-white/10 focus:border-accent py-4 outline-none font-bold text-2xl uppercase tracking-wider placeholder:text-zinc-700 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block">
          Client_Name
        </label>
        <input
          type="text"
          value={data.clientName}
          onChange={(e) => onChange('clientName', e.target.value)}
          placeholder="COMPANY_OR_PERSONAL"
          className="w-full bg-transparent border-b-2 border-white/10 focus:border-accent py-3 outline-none font-bold uppercase tracking-wider placeholder:text-zinc-700 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block">
            Year *
          </label>
          <select
            value={data.year}
            onChange={(e) => onChange('year', e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 focus:border-accent rounded-lg px-4 py-3 outline-none font-mono text-sm uppercase cursor-pointer"
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] block">
            Category *
          </label>
          <select
            value={data.category}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 focus:border-accent rounded-lg px-4 py-3 outline-none font-mono text-sm uppercase cursor-pointer"
          >
            <option value="">Select...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default BuilderStepIdentity;
