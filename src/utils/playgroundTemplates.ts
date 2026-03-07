export const TAILWIND_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Echo Playground</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              background: '#050505',
              accent: '#c4ff0e',
              surface: '#111111',
            },
            fontFamily: {
              sans: ['Inter', 'system-ui', 'sans-serif'],
              mono: ['JetBrains Mono', 'monospace'],
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #050505; color: white; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

export const STARTER_CODE = `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white p-6 font-sans">
      <h1 className="text-5xl font-black tracking-tighter mb-2">
        Echo Playground
      </h1>
      <p className="text-zinc-500 mb-8">
        Start building something amazing
      </p>
      <button
        onClick={() => setCount(c => c + 1)}
        className="bg-accent text-black px-8 py-3 rounded-full font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
      >
        Clicked {count} times
      </button>
    </div>
  );
}`;

export const INITIAL_FILES = {
  '/App.js': STARTER_CODE,
  '/public/index.html': TAILWIND_HTML,
};

export const AI_PROMPTS = [
  'Add a dark glassmorphism card with a gradient border',
  'Create an animated loading spinner',
  'Build a mini calculator',
  'Make a color palette generator',
  'Add a typing animation effect',
];

export const SYSTEM_RULES = `STRICT RULES — FOLLOW EXACTLY:
1. Return ONLY raw JavaScript/JSX code. NO markdown, NO backticks, NO explanations.
2. The FIRST line must be an import statement. The LAST line must be the closing brace of the component.
3. Always use: import { useState, useEffect, useRef } from 'react'; (include all hooks you use)
4. Always export default the component: export default function App() { ... }
5. Use Tailwind CSS classes for ALL styling (no inline styles, no CSS-in-JS)
6. Available Tailwind theme colors: bg-[#050505] (background), bg-[#111111] (surface), text-[#c4ff0e] (accent)
7. Make it visually impressive — use Neo-Brutalist or cyberpunk aesthetic
8. All interactive elements must have hover/active states
9. Keep everything in a single file — no external imports besides React
10. Do NOT include any text before or after the code. No "Here is the code:" or "I made these changes:"

RESPONSE FORMAT — start exactly like this:
import { useState } from 'react';

export default function App() {
  return <div className="min-h-screen bg-[#050505] text-white p-6">Hello</div>;
}`;
