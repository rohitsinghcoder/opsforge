import { fetchWithTimeout } from "./fetchUtils";

const FETCH_TIMEOUT_MS = 20000;

export async function fetchJson(url: string) {
  const response = await fetchWithTimeout(
    url,
    { headers: { Accept: "application/vnd.github+json" } },
    FETCH_TIMEOUT_MS,
  );
  if (!response.ok) return null;
  return await response.json();
}

export async function fetchText(url: string | null | undefined) {
  if (!url) return null;
  const response = await fetchWithTimeout(url, {}, FETCH_TIMEOUT_MS);
  if (!response.ok) return null;
  return await response.text();
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}
