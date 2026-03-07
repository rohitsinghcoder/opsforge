import { v } from "convex/values";
import type { UserIdentity } from "convex/server";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

const chatMessageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("model")),
  parts: v.array(
    v.object({
      text: v.string(),
    }),
  ),
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

const RATE_LIMITS = {
  askEcho: { scope: "ask_echo", limit: 25, windowMs: 15 * 60 * 1000 },
  generateIdea: {
    scope: "generate_project_idea",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  },
  analyzeRepo: {
    scope: "analyze_repo",
    limit: 15,
    windowMs: 60 * 60 * 1000,
  },
  playground: {
    scope: "generate_playground_code",
    limit: 20,
    windowMs: 15 * 60 * 1000,
  },
  synthesizeSpeech: {
    scope: "synthesize_speech",
    limit: 30,
    windowMs: 15 * 60 * 1000,
  },
} as const;

function buildEchoSystemPrompt(projects: unknown) {
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

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

function extractGeminiText(data: GeminiResponse | null): string | null {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  const text = parts
    .map((part) => part?.text ?? "")
    .join("")
    .trim();

  return text || null;
}

function extractGeminiError(data: GeminiResponse | null): string | null {
  return data?.error?.message ?? null;
}

async function callGeminiText(args: {
  apiKey: string;
  model: string;
  contents: Array<{ role?: "user" | "model"; parts: Array<{ text: string }> }>;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": args.apiKey,
      },
      body: JSON.stringify({
        ...(args.systemInstruction
          ? {
              system_instruction: {
                parts: [{ text: args.systemInstruction }],
              },
            }
          : {}),
        contents: args.contents,
        generationConfig: {
          temperature: args.temperature ?? 0.7,
          responseMimeType: args.responseMimeType ?? "text/plain",
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = extractGeminiError(data) ?? `Gemini request failed (${response.status})`;
    throw new Error(`${response.status}:${message}`);
  }

  const text = extractGeminiText(data);
  if (!text) {
    throw new Error("EMPTY_RESPONSE");
  }

  return text;
}

function getFriendlyGeminiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "SYSTEM_FAILURE: Neural link disrupted. Please try again.";
  }

  if (error.message.includes("401") || error.message.includes("403")) {
    return "ERROR: AUTH_FAILURE. Check server AI credentials.";
  }
  if (error.message.includes("429")) {
    return "SYSTEM_WARNING: Rate limit exceeded. Please wait a moment.";
  }
  if (error.message.includes("404")) {
    return "SYSTEM_FAILURE: Model not found. Recalibrating sensors...";
  }
  if (error.message.includes("limit exceeded")) {
    return error.message;
  }

  return "SYSTEM_FAILURE: Neural link disrupted. Please try again.";
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

async function fetchText(url: string | null | undefined) {
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  return await response.text();
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

type IdentityContext = {
  auth: {
    getUserIdentity(): Promise<UserIdentity | null>;
  };
};

async function getRateLimitIdentifier(ctx: IdentityContext, clientId: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    return `user:${identity.subject}`;
  }
  return `anon:${clientId}`;
}

export const consumeRateLimit = internalMutation({
  args: {
    identifier: v.string(),
    scope: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - (now % args.windowMs);

    const existing = await ctx.db
      .query("api_rate_limits")
      .withIndex("by_identifier_scope_window", (q) =>
        q
          .eq("identifier", args.identifier)
          .eq("scope", args.scope)
          .eq("windowStart", windowStart),
      )
      .unique();

    if (existing) {
      if (existing.count >= args.limit) {
        throw new Error("Request limit exceeded for this time window.");
      }

      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
        updatedAt: now,
      });
      return;
    }

    await ctx.db.insert("api_rate_limits", {
      identifier: args.identifier,
      scope: args.scope,
      windowStart,
      count: 1,
      updatedAt: now,
    });
  },
});

export const askEcho = action({
  args: {
    query: v.string(),
    history: v.optional(v.array(chatMessageValidator)),
    clientId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return "ERROR: AI service not configured on the server.";
    }

    try {
      await ctx.runMutation(internal.ai.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.askEcho,
      });

      const projects = await ctx.runQuery(api.projects.get, {});
      const text = await callGeminiText({
        apiKey,
        model: "gemini-2.5-flash",
        systemInstruction: buildEchoSystemPrompt(projects),
        contents: [
          ...(args.history ?? []),
          { role: "user", parts: [{ text: args.query }] },
        ],
        temperature: 0.7,
      });

      return text;
    } catch (error) {
      return getFriendlyGeminiError(error);
    }
  },
});

export const generateProjectIdea = action({
  args: {
    skills: v.array(v.string()),
    complexity: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
    category: v.optional(v.string()),
    clientId: v.string(),
  },
  returns: v.union(projectIdeaValidator, v.string()),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return "AI service not configured on the server.";
    }

    const complexityGuide = {
      beginner:
        "2-4 hours to build, simple logic, 5-10 files max, no complex state management",
      intermediate:
        "1-2 days to build, moderate complexity, 10-20 files, may include API integration",
      advanced:
        "3-7 days to build, complex architecture, 20+ files, includes auth/database/deployment",
    } as const;

    const skillsList = args.skills.join(", ");
    const categoryHint = args.category
      ? `The project should be a ${args.category}.`
      : "";

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
      await ctx.runMutation(internal.ai.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.generateIdea,
      });

      const rawText = await callGeminiText({
        apiKey,
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        temperature: 0.9,
        responseMimeType: "application/json",
      });

      return JSON.parse(cleanJsonResponse(rawText));
    } catch (error) {
      if (error instanceof SyntaxError) {
        return "Failed to parse project idea. Please try again.";
      }
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
  returns: v.object({
    text: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { error: "AI service not configured on the server." };
    }

    const codeOnlyRule =
      "\n\nCRITICAL: Return ONLY the complete JavaScript/JSX code. No markdown fences, no explanations, no comments about what you changed. Start directly with the import statements. The response must be a complete, working React component file.";

    const fullPrompt = args.currentCode
      ? `You are a React code editor. Here is the CURRENT complete code:\n\n${args.currentCode}\n\n---\nThe user wants this modification: "${args.prompt}"\n\nApply the requested change to the code above and return the COMPLETE modified file. Do NOT remove any existing functionality unless the user explicitly asks. Preserve all imports, state, and logic.\n\n${args.systemRules}${codeOnlyRule}`
      : `You are a React component generator. Create a complete React component that: ${args.prompt}\n\n${args.systemRules}${codeOnlyRule}`;

    try {
      await ctx.runMutation(internal.ai.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.playground,
      });

      const text = await callGeminiText({
        apiKey,
        model: "gemini-2.5-flash",
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
  args: {
    repoFullName: v.string(),
    clientId: v.string(),
  },
  returns: v.union(repoAnalysisValidator, v.string()),
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return "AI service not configured on the server.";
    }

    const [owner, repo] = args.repoFullName.split("/");
    if (!owner || !repo) {
      return "Invalid repository name.";
    }

    try {
      await ctx.runMutation(internal.ai.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.analyzeRepo,
      });

      const [repoData, readmeMetadata, fileTree, packageJsonMetadata, languages] =
        await Promise.all([
          fetchJson(`https://api.github.com/repos/${owner}/${repo}`),
          fetchJson(`https://api.github.com/repos/${owner}/${repo}/readme`),
          fetchJson(`https://api.github.com/repos/${owner}/${repo}/contents`),
          fetchJson(
            `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
          ),
          fetchJson(`https://api.github.com/repos/${owner}/${repo}/languages`),
        ]);

      if (!repoData) {
        return "Could not fetch repository data. Make sure it's a public repository.";
      }

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
        const totalBytes = Object.values(languages as Record<string, number>).reduce(
          (total, value) => total + value,
          0,
        );
        const breakdown = Object.entries(languages as Record<string, number>)
          .map(([language, bytes]) =>
            `${language}: ${Math.round((bytes / totalBytes) * 100)}%`,
          )
          .join(", ");
        contextParts.push(`Language breakdown: ${breakdown}`);
      }

      if (Array.isArray(fileTree) && fileTree.length > 0) {
        const topLevelEntries = fileTree
          .slice(0, 20)
          .map((file: { name: string; type: string }) =>
            `${file.type === "dir" ? "[dir]" : "[file]"} ${file.name}`,
          );
        contextParts.push(`File structure:\n${topLevelEntries.join("\n")}`);
      }

      if (packageJson) {
        const deps = Object.keys(packageJson.dependencies ?? {});
        const devDeps = Object.keys(packageJson.devDependencies ?? {});

        if (deps.length > 0) {
          contextParts.push(`Dependencies: ${deps.slice(0, 15).join(", ")}`);
        }
        if (devDeps.length > 0) {
          contextParts.push(`Dev Dependencies: ${devDeps.slice(0, 10).join(", ")}`);
        }
      }

      if (readme) {
        contextParts.push(`README (excerpt):\n${readme.substring(0, 1500)}`);
      }

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
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        temperature: 0.7,
      });

      return {
        summary,
        techStack: [],
        projectType: "",
        complexity: "",
      };
    } catch (error) {
      return getFriendlyGeminiError(error);
    }
  },
});

export const synthesizeSpeech = action({
  args: {
    text: v.string(),
    clientId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      audioBase64: v.string(),
      mimeType: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      await ctx.runMutation(internal.ai.consumeRateLimit, {
        identifier: await getRateLimitIdentifier(ctx, args.clientId),
        ...RATE_LIMITS.synthesizeSpeech,
      });

      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: args.text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );

      if (!response.ok) {
        return null;
      }

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
