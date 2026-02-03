import { GoogleGenAI } from '@google/genai';

interface RepoData {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  html_url: string;
}

interface RepoAnalysis {
  summary: string;
  techStack: string[];
  projectType: string;
  complexity: string;
}

// Fetch repo metadata from GitHub API
async function fetchRepoMetadata(owner: string, repo: string): Promise<RepoData | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Fetch README content
async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
    if (!response.ok) return null;
    const data = await response.json();
    // Content is base64 encoded
    return atob(data.content);
  } catch {
    return null;
  }
}

// Fetch file tree (top level)
async function fetchFileTree(owner: string, repo: string): Promise<string[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((file: { name: string; type: string }) => 
      `${file.type === 'dir' ? '📁' : '📄'} ${file.name}`
    );
  } catch {
    return [];
  }
}

// Fetch package.json if exists
async function fetchPackageJson(owner: string, repo: string): Promise<object | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`);
    if (!response.ok) return null;
    const data = await response.json();
    const content = atob(data.content);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Fetch language breakdown
async function fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

// Main function to analyze a repo
export async function analyzeGitHubRepo(repoFullName: string): Promise<RepoAnalysis | string> {
  const [owner, repo] = repoFullName.split('/');
  
  if (!owner || !repo) {
    return 'Invalid repository name';
  }

  // Fetch all data in parallel
  const [repoData, readme, fileTree, packageJson, languages] = await Promise.all([
    fetchRepoMetadata(owner, repo),
    fetchReadme(owner, repo),
    fetchFileTree(owner, repo),
    fetchPackageJson(owner, repo),
    fetchLanguages(owner, repo),
  ]);

  if (!repoData) {
    return 'Could not fetch repository data. Make sure it\'s a public repository.';
  }

  // Build context for AI
  const contextParts: string[] = [];
  
  contextParts.push(`Repository: ${repoData.full_name}`);
  contextParts.push(`Description: ${repoData.description || 'No description'}`);
  contextParts.push(`Primary Language: ${repoData.language || 'Unknown'}`);
  
  if (repoData.topics && repoData.topics.length > 0) {
    contextParts.push(`Topics: ${repoData.topics.join(', ')}`);
  }

  if (Object.keys(languages).length > 0) {
    const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
    const langBreakdown = Object.entries(languages)
      .map(([lang, bytes]) => `${lang}: ${Math.round((bytes / totalBytes) * 100)}%`)
      .join(', ');
    contextParts.push(`Language breakdown: ${langBreakdown}`);
  }

  if (fileTree.length > 0) {
    contextParts.push(`\nFile structure:\n${fileTree.slice(0, 20).join('\n')}`);
  }

  if (packageJson) {
    const pkg = packageJson as { dependencies?: object; devDependencies?: object; scripts?: object };
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    if (deps.length > 0) {
      contextParts.push(`\nDependencies: ${deps.slice(0, 15).join(', ')}`);
    }
    if (devDeps.length > 0) {
      contextParts.push(`Dev Dependencies: ${devDeps.slice(0, 10).join(', ')}`);
    }
  }

  if (readme) {
    // Truncate README to first 1500 chars
    contextParts.push(`\nREADME (excerpt):\n${readme.substring(0, 1500)}`);
  }

  const context = contextParts.join('\n');

  // Call Gemini
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY) {
    return 'API key not configured';
  }

  const client = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `You are a senior developer analyzing a GitHub repository. Based on the following information, provide a concise but insightful analysis.

${context}

Respond in this exact format (keep each section to 1-2 sentences max):

**What it does:** [Brief description of what this project does]

**Tech Stack:** [List the main technologies used]

**Project Type:** [e.g., Web App, CLI Tool, Library, API, etc.]

**Complexity:** [Simple/Medium/Advanced - with brief justification]

**Notable Features:** [Any interesting patterns or features you notice]

Keep the entire response under 200 words. Be specific and technical.`;

  try {
    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
      },
    });

    return {
      summary: result.text || 'Could not generate analysis',
      techStack: [],
      projectType: '',
      complexity: '',
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return 'Failed to analyze repository. Please try again.';
  }
}
