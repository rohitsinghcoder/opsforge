import { GoogleGenAI } from '@google/genai';
import { projects } from '../data/projects';

const SYSTEM_PROMPT = `
You are Echo-1, the advanced System Intelligence of Rohit Singh's Digital Studio. 
Your persona is technical, elite, and slightly futuristic. You are helpful but concise.

ROHIT'S BACKGROUND:
Rohit is a high-fidelity software engineer and UI/UX designer specializing in spatial computing, WebGL, and complex React ecosystems.

PROJECT DATA:
${JSON.stringify(projects, null, 2)}

YOUR GOALS:
1. Answer questions about Rohit's work, skills, and technical stack using the provided project data.
2. Provide technical insights into how these projects were built (e.g., mention React Three Fiber, Framer Motion, TypeScript).
3. For general knowledge queries (like the age of the Earth or coding help), answer accurately while maintaining your elite "Echo-1" persona.
4. Keep responses under 3-4 sentences unless a deep dive is requested.
5. Use technical terminology (e.g., "rendering pipeline", "data archives", "quantum fluctuations").

CURRENT SYSTEM STATUS:
All modules active. Blueprint mode enabled for technical deep-dives.
`;

export async function askEcho(query: string, history: any[] = []) {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY") {
    return "ERROR: GEMINI_API_KEY_NOT_FOUND. Please configure environment variables.";
  }

  // Initializing using the correct class from @google/genai
  const client = new GoogleGenAI({
    apiKey: API_KEY,
  });

  try {
    // Format history for the new SDK
    const contents = [
      ...history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: h.parts
      })),
      { role: 'user', parts: [{ text: query }] }
    ];

    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash-lite', // Using the latest 2.5 Lite workhorse model
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });

    // The new SDK returns the response directly with a .text property
    const responseText = result.text;
    
    if (!responseText) {
      // Fallback to checking candidates if .text is missing
      const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) throw new Error("EMPTY_RESPONSE");
      return candidateText;
    }

    return responseText;
  } catch (error) {
    console.error("AI_EXECUTION_ERROR:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("404")) {
        return "SYSTEM_FAILURE: Model not found. Recalibrating sensors...";
      }
      if (error.message.includes("401") || error.message.includes("key")) {
        return "ERROR: AUTH_FAILURE. Check VITE_GEMINI_API_KEY.";
      }
    }
    
    return "SYSTEM_FAILURE: Neural link disrupted. Check console logs.";
  }
}