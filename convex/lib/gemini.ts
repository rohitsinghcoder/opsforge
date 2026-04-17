import { fetchWithTimeout } from "./fetchUtils";

const GEMINI_TIMEOUT_MS = 20000;

export const MAX_QUERY_LENGTH = 2000;
export const MAX_CODE_PROMPT_LENGTH = 4000;
export const MAX_SYSTEM_RULES_LENGTH = 8000;
export const MAX_TTS_LENGTH = 1200;

export function assertMaxLength(value: string, max: number, fieldName: string) {
  if (value.length > max) {
    throw new Error(`${fieldName} exceeds the ${max} character limit.`);
  }
}

type GeminiPart = { text?: string };

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  error?: { message?: string };
};

function extractGeminiText(data: GeminiResponse | null): string | null {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.map((part) => part?.text ?? "").join("").trim();
  return text || null;
}

function extractGeminiError(data: GeminiResponse | null): string | null {
  return data?.error?.message ?? null;
}

export async function callGeminiText(args: {
  apiKey: string;
  model: string;
  contents: Array<{ role?: "user" | "model"; parts: Array<{ text: string }> }>;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}) {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": args.apiKey,
      },
      body: JSON.stringify({
        ...(args.systemInstruction
          ? { system_instruction: { parts: [{ text: args.systemInstruction }] } }
          : {}),
        contents: args.contents,
        generationConfig: {
          temperature: args.temperature ?? 0.7,
          responseMimeType: args.responseMimeType ?? "text/plain",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
    GEMINI_TIMEOUT_MS,
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = extractGeminiError(data) ?? `Gemini request failed (${response.status})`;
    throw new Error(`${response.status}:${message}`);
  }

  const text = extractGeminiText(data);
  if (!text) throw new Error("EMPTY_RESPONSE");
  return text;
}

export function getFriendlyGeminiError(error: unknown): string {
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
  if (error.name === "AbortError") {
    return "SYSTEM_TIMEOUT: Upstream model took too long to respond.";
  }
  if (error.message.includes("limit exceeded")) {
    return error.message;
  }
  return "SYSTEM_FAILURE: Neural link disrupted. Please try again.";
}

export function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}
