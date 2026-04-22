import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

import {
  callGeminiText,
  getFriendlyGeminiError,
  cleanJsonResponse,
  assertMaxLength,
  MAX_QUERY_LENGTH,
  MAX_CODE_PROMPT_LENGTH,
  MAX_SYSTEM_RULES_LENGTH,
  MAX_TTS_LENGTH,
} from "./lib/gemini";
import { RATE_LIMITS, getRateLimitIdentifier } from "./lib/rateLimit";
import { fetchJson, fetchText, arrayBufferToBase64 } from "./lib/github";

const chatMessageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("model")),
  parts: v.array(v.object({ text: v.string() })),
});

const projectIdeaValidator = v.object({
  title: v.string(),
  description: v.string(),
  stack: v.array(v.string()),
  files: v.array(v.string()),
  steps: v.array(v.string()),
  category: v.string(),
  complexity: v.string(),
});

const repoAnalysisValidator = v.object({
  summary: v.string(),
  techStack: v.array(v.string()),
  projectType: v.string(),
  complexity: v.string(),
});

const ELEVENLABS_TIMEOUT_MS = 15000;

function buildEchoSystemPrompt(projects: Doc<"projects">[]) {
  return `
You are Echo-1, the advanced System Intelligence of Rohit Singh's Digital Studio.
Your persona is technical, elite, and slightly futuristic. You are helpful but concise.

ROHIT'S BACKGROUND:
Rohit is a high-fidelity software engineer and UI/UX designer specializing in spatial computing, WebGL, and complex React ecosystems.

PROJECT DATA:
${JSON.stringify(projects, null, 2)}

YOUR GOALS:
1. Answer questions about Rohit's work, skills, and technical stack using the provided project data.
2. Provide technical insights into how these projects were built.
3. For general knowledge queries, answer accurately while maintaining the Echo-1 persona.
4. Keep responses under 3-4 sentences unless a deep dive is requested.
5. Use technical terminology where it fits naturally.

CURRENT SYSTEM STATUS:
All modules active. Blueprint mode enabled for technical deep-dives.
`.trim();
}

// ── Actions ──────────────────────────────────────────────────────────────────

export const askEcho = action({
  args: {
    query: v.string(),
    history: v.optional(v.array(chatMessageValidator)),
    clientId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "ERROR: AI service not configured on the server.";

    try {
      assertMaxLength(args.query, MAX_QUERY_LENGTH, "query");
      await ctx.runMutation(internal.rateLimit.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.askEcho,
      });

      const projects = await ctx.runQuery(api.projects.get, {});
      return await callGeminiText({
        apiKey,
        model: "gemini-1.5-flash",
        systemInstruction: buildEchoSystemPrompt(projects),
        contents: [
          ...(args.history ?? []),
          { role: "user", parts: [{ text: args.query }] },
        ],
        temperature: 0.7,
      });
    } catch (error) {
      return getFriendlyGeminiError(error);
    }
  },
});

export const generateProjectIdea = action({
  args: {
    skills: v.array(v.string()),
    complexity: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    category: v.optional(v.string()),
    clientId: v.string(),
  },
  returns: v.union(projectIdeaValidator, v.string()),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "AI service not configured on the server.";

    const complexityGuide = {
      beginner: "2-4 hours to build, simple logic, 5-10 files max, no complex state management",
      intermediate: "1-2 days to build, moderate complexity, 10-20 files, may include API integration",
      advanced: "3-7 days to build, complex architecture, 20+ files, includes auth/database/deployment",
    } as const;

    const skillsList = args.skills.join(", ");
    const categoryHint = args.category ? `The project should be a ${args.category}.` : "";

    const prompt = `You are a senior developer and project mentor. Generate a unique, creative project idea for someone with these skills: ${skillsList}.

Complexity level: ${args.complexity} (${complexityGuide[args.complexity]})
${categoryHint}

IMPORTANT: Be creative and specific. Don't suggest generic todo apps or weather apps. Think of something unique that would impress in a portfolio.

Respond in EXACTLY this JSON format (no markdown, just raw JSON):
{
  "title": "Project Name",
  "description": "2-3 sentence description of what the project does and why it's interesting",
  "stack": ["Tech1", "Tech2", "Tech3"],
  "files": ["src/", "src/index.ts", "package.json"],
  "steps": ["Step 1: ...", "Step 2: ..."],
  "category": "Web App",
  "complexity": "${args.complexity}"
}

Rules:
- stack should have 3-6 technologies that work well together
- files should show a realistic file structure
- steps should be actionable and specific (5-8 steps)
- Make the project unique and portfolio-worthy`;

    try {
      assertMaxLength(skillsList, MAX_QUERY_LENGTH, "skills");
      if (args.category) assertMaxLength(args.category, 120, "category");

      await ctx.runMutation(internal.rateLimit.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.generateIdea,
      });

      const rawText = await callGeminiText({
        apiKey,
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        temperature: 0.9,
        responseMimeType: "application/json",
      });

      return JSON.parse(cleanJsonResponse(rawText));
    } catch (error) {
      if (error instanceof SyntaxError) return "Failed to parse project idea. Please try again.";
      return getFriendlyGeminiError(error);
    }
  },
});

export const generatePlaygroundCode = action({
  args: {
    prompt: v.string(),
    currentCode: v.optional(v.string()),
    systemRules: v.string(),
    clientId: v.string(),
  },
  returns: v.object({ text: v.optional(v.string()), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { error: "AI service not configured on the server." };

    const codeOnlyRule =
      "\n\nCRITICAL: Return ONLY the complete JavaScript/JSX code. No markdown fences, no explanations, no comments about what you changed. Start directly with the import statements. The response must be a complete, working React component file.";

    const fullPrompt = args.currentCode
      ? `You are a React code editor. Here is the CURRENT complete code:\n\n${args.currentCode}\n\n---\nThe user wants this modification: "${args.prompt}"\n\nApply the requested change to the code above and return the COMPLETE modified file. Do NOT remove any existing functionality unless the user explicitly asks. Preserve all imports, state, and logic.\n\n${args.systemRules}${codeOnlyRule}`
      : `You are a React component generator. Create a complete React component that: ${args.prompt}\n\n${args.systemRules}${codeOnlyRule}`;

    try {
      assertMaxLength(args.prompt, MAX_CODE_PROMPT_LENGTH, "prompt");
      assertMaxLength(args.systemRules, MAX_SYSTEM_RULES_LENGTH, "systemRules");
      if (args.currentCode) assertMaxLength(args.currentCode, 20000, "currentCode");

      await ctx.runMutation(internal.rateLimit.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.playground,
      });

      const text = await callGeminiText({
        apiKey,
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        temperature: 0.7,
      });

      return { text };
    } catch (error) {
      return { error: getFriendlyGeminiError(error) };
    }
  },
});

export const analyzeGitHubRepo = action({
  args: { repoFullName: v.string(), clientId: v.string() },
  returns: v.union(repoAnalysisValidator, v.string()),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "AI service not configured on the server.";

    const [owner, repo] = args.repoFullName.split("/");
    if (!owner || !repo) return "Invalid repository name.";

    try {
      assertMaxLength(args.repoFullName, 200, "repoFullName");
      await ctx.runMutation(internal.rateLimit.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.analyzeRepo,
      });

      const [repoData, readmeMetadata, fileTree, packageJsonMetadata, languages] =
        await Promise.all([
          fetchJson(`https://api.github.com/repos/${owner}/${repo}`),
          fetchJson(`https://api.github.com/repos/${owner}/${repo}/readme`),
          fetchJson(`https://api.github.com/repos/${owner}/${repo}/contents`),
          fetchJson(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`),
          fetchJson(`https://api.github.com/repos/${owner}/${repo}/languages`),
        ]);

      if (!repoData) return "Could not fetch repository data. Make sure it's a public repository.";

      const [readme, packageJsonText] = await Promise.all([
        fetchText(readmeMetadata?.download_url),
        fetchText(packageJsonMetadata?.download_url),
      ]);

      const packageJson = packageJsonText ? JSON.parse(packageJsonText) : null;
      const contextParts: string[] = [];

      contextParts.push(`Repository: ${repoData.full_name}`);
      contextParts.push(`Description: ${repoData.description || "No description"}`);
      contextParts.push(`Primary Language: ${repoData.language || "Unknown"}`);

      if (Array.isArray(repoData.topics) && repoData.topics.length > 0) {
        contextParts.push(`Topics: ${repoData.topics.join(", ")}`);
      }
      if (languages && Object.keys(languages).length > 0) {
        const totalBytes = Object.values(languages as Record<string, number>).reduce((t, v) => t + v, 0);
        const breakdown = Object.entries(languages as Record<string, number>)
          .map(([lang, bytes]) => `${lang}: ${Math.round((bytes / totalBytes) * 100)}%`)
          .join(", ");
        contextParts.push(`Language breakdown: ${breakdown}`);
      }
      if (Array.isArray(fileTree) && fileTree.length > 0) {
        const topLevel = fileTree
          .slice(0, 20)
          .map((f: { name: string; type: string }) => `${f.type === "dir" ? "[dir]" : "[file]"} ${f.name}`);
        contextParts.push(`File structure:\n${topLevel.join("\n")}`);
      }
      if (packageJson) {
        const deps = Object.keys(packageJson.dependencies ?? {});
        const devDeps = Object.keys(packageJson.devDependencies ?? {});
        if (deps.length > 0) contextParts.push(`Dependencies: ${deps.slice(0, 15).join(", ")}`);
        if (devDeps.length > 0) contextParts.push(`Dev Dependencies: ${devDeps.slice(0, 10).join(", ")}`);
      }
      if (readme) contextParts.push(`README (excerpt):\n${readme.substring(0, 1500)}`);

      const prompt = `You are a senior developer analyzing a GitHub repository. Based on the following information, provide a concise but insightful analysis.

${contextParts.join("\n")}

Respond in this exact format (keep each section to 1-2 sentences max):

**What it does:** [Brief description of what this project does]

**Tech Stack:** [List the main technologies used]

**Project Type:** [e.g., Web App, CLI Tool, Library, API, etc.]

**Complexity:** [Simple/Medium/Advanced - with brief justification]

**Notable Features:** [Any interesting patterns or features you notice]

Keep the entire response under 200 words. Be specific and technical.`;

      const summary = await callGeminiText({
        apiKey,
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        temperature: 0.7,
      });

      const inferredTechStack = Array.from(
        new Set(
          [repoData.language, ...Object.keys(packageJson?.dependencies ?? {}).slice(0, 5), ...Object.keys(packageJson?.devDependencies ?? {}).slice(0, 3)]
            .filter((v): v is string => Boolean(v)),
        ),
      );

      const inferredProjectType = packageJson
        ? "Web App"
        : Array.isArray(fileTree) && fileTree.some((f: { name: string }) => f.name === "Cargo.toml")
          ? "Native App"
          : "Repository";

      const depCount = Object.keys(packageJson?.dependencies ?? {}).length + Object.keys(packageJson?.devDependencies ?? {}).length;
      const inferredComplexity = depCount > 20 || (Array.isArray(fileTree) && fileTree.length > 12) ? "Advanced" : depCount > 8 ? "Medium" : "Simple";

      return { summary, techStack: inferredTechStack, projectType: inferredProjectType, complexity: inferredComplexity };
    } catch (error) {
      return getFriendlyGeminiError(error);
    }
  },
});

export const synthesizeSpeech = action({
  args: { text: v.string(), clientId: v.string() },
  returns: v.union(v.null(), v.object({ audioBase64: v.string(), mimeType: v.string() })),
  handler: async (ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return null;

    try {
      assertMaxLength(args.text, MAX_TTS_LENGTH, "text");
      await ctx.runMutation(internal.rateLimit.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.synthesizeSpeech,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb", {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
          body: JSON.stringify({
            text: args.text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) return null;

      const buffer = await response.arrayBuffer();
      return {
        audioBase64: arrayBufferToBase64(buffer),
        mimeType: response.headers.get("content-type") ?? "audio/mpeg",
      };
    } catch {
      return null;
    }
  },
});
