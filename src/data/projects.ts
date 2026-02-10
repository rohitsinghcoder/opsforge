export interface Project {
  id: number;
  slug: string;
  title: string;
  category: string;
  image: string;
  wireframe: string;
  year: string;
  client: string;
  role: string;
  description: string;
  stack: string[];
}

// Extended type for projects returned from Convex (includes DB-generated fields)
export interface ConvexProject extends Project {
  _id: string;
  _creationTime: number;
  is_hidden: boolean;
}

export const projects: Project[] = [
  { 
    id: 1, 
    slug: "hyperion-os",
    client: "Apple Inc.", 
    title: "Hyperion OS", 
    category: "Spatial Computing", 
    year: "2025", 
    role: "Lead Interface Designer",
    image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1200",
    wireframe: "https://images.unsplash.com/photo-1581291518066-8e250100d233?auto=format&fit=crop&q=80&w=1200",
    description: "Hyperion OS is a paradigm-shifting spatial operating system designed for the next generation of mixed-reality hardware. Our team focused on creating a fluid, depth-aware interface that minimizes cognitive load while maximizing user immersion.",
    stack: ["SwiftUI", "RealityKit", "Metal", "Unity"]
  },
  { 
    id: 2, 
    slug: "nexus-labs",
    client: "Nike Digital", 
    title: "Nexus Labs", 
    category: "Brand Identity", 
    year: "2024", 
    role: "Creative Director",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200",
    wireframe: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200",
    description: "Nexus Labs is an experimental platform for athletic performance data visualization. We developed a visual language that translates complex biomechanical data into intuitive, high-performance aesthetic narratives.",
    stack: ["React", "Three.js", "D3.js", "WebAssembly"]
  },
  { 
    id: 3, 
    slug: "aether-engine",
    client: "Tesla", 
    title: "Aether Engine", 
    category: "WebGL Dev", 
    year: "2024", 
    role: "Technical Architect",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=1200",
    wireframe: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200",
    description: "Aether Engine is a real-time 3D rendering pipeline for automotive configurators. It achieves near-path-traced quality in the browser, allowing for hyper-realistic vehicle customization and lighting simulation.",
    stack: ["WebGL 2.0", "GLSL", "Node.js", "Docker"]
  },
  { 
    id: 4, 
    slug: "nova-ui",
    client: "Adobe", 
    title: "Nova UI", 
    category: "Design System", 
    year: "2023", 
    role: "UI/UX Designer",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    wireframe: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&q=80&w=1200",
    description: "Nova UI is a comprehensive design system built for multi-modal creative workflows. It harmonizes input methods across stylus, touch, and keyboard, providing a unified experience for Adobe's next-gen creative suite.",
    stack: ["TypeScript", "Tailwind CSS", "Storybook", "Figma API"]
  },
];
