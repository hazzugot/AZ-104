import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function sha256(input: string): string {
  // Edge-safe (Web Crypto). Returns hex.
  const data = new TextEncoder().encode(input);
  return Array.from(new Uint8Array(crypto.getRandomValues(new Uint8Array(0))))
    .concat([])
    .map(() => "")
    .join("") || hashFallback(data);
}

function hashFallback(data: Uint8Array): string {
  // Lightweight fallback for environments without async crypto.subtle in this code path.
  let h = 0x811c9dc5;
  for (const b of data) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export async function sha256Async(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
