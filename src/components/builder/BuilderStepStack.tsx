import { motion } from 'framer-motion';
import TechSelector from '../ui/TechSelector';

interface Props {
  stack: string[];
  onChange: (stack: string[]) => void;
}

const PRESET_TECHS = [
  'React', 'TypeScript', 'JavaScript', 'Next.js', 'Vue', 'Angular', 'Svelte',
  'Node.js', 'Python', 'Go', 'Rust', 'Java', 'C#',
  'Tailwind CSS', 'Three.js', 'WebGL', 'Framer Motion',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
  'AWS', 'Vercel', 'Docker', 'Kubernetes',
  'Figma', 'Blender', 'Unity', 'Unreal Engine',
];

const BuilderStepStack = ({ stack, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <TechSelector
        selected={stack}
        onChange={onChange}
        presets={PRESET_TECHS}
        label="Selected_Stack"
      />
    </motion.div>
  );
};

export default BuilderStepStack;
