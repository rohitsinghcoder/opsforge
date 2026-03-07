# Gem - Echo Studio Portfolio

A futuristic, interactive portfolio site for Echo Studio with 3D visuals, blueprint diagnostics, an AI command palette, and Convex-backed analytics.

## Highlights
- 3D morphing background sphere with React Three Fiber and cinematic motion via Framer Motion.
- Blueprint mode with grid overlay, component metadata HUD, and interaction heatmap.
- Command palette (Cmd/Ctrl+K) with navigation, /ask AI assistant, and /override breach sequence.
- Project Vault with horizontal scroll explorer and detailed case study pages.
- Clerk authentication with protected routes and GitHub-linked "My Projects".
- Convex backend for project data, user tracking, system logs, and heatmap interactions.

## Routes
- `/` Home landing.
- `/vault` Project Vault (signed-in only).
- `/works` Works grid of projects.
- `/works/:slug` Project detail.
- `/archive` Timeline-style project list.
- `/contact` Contact form.
- `/my-projects` GitHub repositories + AI analysis (signed-in only).

## Command palette
Open with Cmd/Ctrl+K.
Commands: `/home`, `/vault`, `/works`, `/archive`, `/contact`, `/github`, `/blueprint`, `/ask`, `/override`.

## Data flow
- Projects are seeded from `src/data/projects` into Convex on first load if empty.
- Page views and heatmap interactions are tracked per session.
- System events like breaches and AI queries are logged.

## Tech stack
- React 19 + TypeScript + Vite
- React Router
- Tailwind CSS v4
- React Three Fiber + Drei + Three.js
- Framer Motion
- Clerk (auth)
- Convex (database + analytics)
- Google Gemini (AI assistant + repo analysis)

## Local development
1. Install dependencies:
   `npm install`
2. Create a `.env.local` with:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_CONVEX_URL=your_convex_deployment_url
   ```
3. Start the dev server:
   `npm run dev`

4. Configure Convex server env vars:
   ```
   CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-frontend-api
   GEMINI_API_KEY=your_gemini_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```
   Set them with `npx convex env set ...` on the deployment you are using.

5. In Clerk, create a JWT template named `convex`.

## Scripts
- `npm run dev` - start Vite
- `npm run build` - typecheck + build
- `npm run preview` - preview build
- `npm run lint` - lint code

## Notes
- `/my-projects` requires a Clerk user with GitHub OAuth connected.
- Convex auth requires `convex/auth.config.ts` to match your Clerk Frontend API URL.
