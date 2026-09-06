import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderJsonTranscript } from "./report/json.js";
import { renderMarkdownTranscript } from "./report/markdown.js";
import type { SmokeRunResult } from "./types.js";
import { SmokeRollError } from "./errors.js";

export function validateTranscriptDestinations(destinations: {
  markdown?: string;
  json?: string;
}): void {
  if (
    destinations.markdown &&
    destinations.json &&
    path.resolve(destinations.markdown) === path.resolve(destinations.json)
  ) {
    throw new SmokeRollError("Markdown and JSON transcript destinations must be different paths.");
  }
}

export async function writeTranscripts(
  result: SmokeRunResult,
  destinations: { markdown?: string; json?: string },
): Promise<void> {
  validateTranscriptDestinations(destinations);
  await Promise.all([
    destinations.markdown
      ? writeOutput(destinations.markdown, renderMarkdownTranscript(result))
      : undefined,
    destinations.json ? writeOutput(destinations.json, renderJsonTranscript(result)) : undefined,
  ]);
}

async function writeOutput(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
  await writeFile(filePath, content, "utf8");
}
