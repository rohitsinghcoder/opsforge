import { GoogleGenAI } from '@google/genai';

export interface ProjectIdea {
  title: string;
  description: string;
  stack: string[];
  files: string[];
  steps: string[];
  category: string;
  complexity: string;
}

export interface GenerateIdeaParams {
  skills: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
}

export async function generateProjectIdea(params: GenerateIdeaParams): Promise<ProjectIdea | string> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY) {
    return 'API key not configured. Set VITE_GEMINI_API_KEY in your environment.';
  }

  const client = new GoogleGenAI({ apiKey: API_KEY });

  const skillsList = params.skills.join(', ');
  const categoryHint = params.category ? `The project should be a ${params.category}.` : '';
  
  const complexityGuide = {
    beginner: '2-4 hours to build, simple logic, 5-10 files max, no complex state management',
    intermediate: '1-2 days to build, moderate complexity, 10-20 files, may include API integration',
    advanced: '3-7 days to build, complex architecture, 20+ files, includes auth/database/deployment',
  };

  const prompt = `You are a senior developer and project mentor. Generate a unique, creative project idea for someone with these skills: ${skillsList}.

Complexity level: ${params.complexity} (${complexityGuide[params.complexity]})
${categoryHint}

IMPORTANT: Be creative and specific. Don't suggest generic todo apps or weather apps. Think of something unique that would impress in a portfolio.

Respond in EXACTLY this JSON format (no markdown, just raw JSON):
{
  "title": "Project Name",
  "description": "2-3 sentence description of what the project does and why it's interesting",
  "stack": ["Tech1", "Tech2", "Tech3"],
  "files": [
    "src/",
    "src/index.ts",
    "src/components/",
    "src/components/Main.tsx",
    "package.json",
    "README.md"
  ],
  "steps": [
    "Step 1: Set up project with...",
    "Step 2: Create the...",
    "Step 3: Implement...",
    "Step 4: Add...",
    "Step 5: Polish and..."
  ],
  "category": "Web App",
  "complexity": "${params.complexity}"
}

Rules:
- stack should have 3-6 technologies that work well together
- files should show a realistic file structure (10-20 items for intermediate)
- steps should be actionable and specific (5-8 steps)
- Make the project unique and portfolio-worthy`;

  try {
    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.9, // Higher for creativity
      },
    });

    const responseText = result.text || '';
    
    // Try to parse the JSON response
    try {
      // Clean up the response - remove any markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();
      
      const parsed = JSON.parse(cleanedResponse) as ProjectIdea;
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', responseText);
      return 'Failed to parse project idea. Please try again.';
    }
  } catch (error) {
    console.error('AI generation error:', error);
    return 'Failed to generate project idea. Please try again.';
  }
}
