import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderJsonTranscript } from "./report/json.js";
import { renderMarkdownTranscript } from "./report/markdown.js";
import type { SmokeRunResult } from "./types.js";

export async function writeTranscripts(
  result: SmokeRunResult,
  destinations: { markdown?: string; json?: string },
): Promise<void> {
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

