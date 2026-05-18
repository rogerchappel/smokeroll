import type { SmokeRunResult } from "../types.js";

export function renderJsonTranscript(result: SmokeRunResult): string {
  return JSON.stringify(result, null, 2) + "\n";
}

