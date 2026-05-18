import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadManifest } from "../src/manifest.js";
import { renderJsonTranscript } from "../src/report/json.js";
import { renderMarkdownTranscript } from "../src/report/markdown.js";
import { runPlan } from "../src/runner.js";

describe("transcript renderers", () => {
  it("renders markdown with status and command output", async () => {
    const result = await runPlan(await loadManifest("fixtures/pass/smokeroll.json"));
    const markdown = renderMarkdownTranscript(result);

    assert.match(markdown, /# SmokeRoll Transcript/);
    assert.match(markdown, /Status: PASS/);
    assert.match(markdown, /hello SmokeRoll/);
  });

  it("renders parseable json", async () => {
    const result = await runPlan(await loadManifest("fixtures/pass/smokeroll.json"));
    const json = renderJsonTranscript(result);
    const parsed = JSON.parse(json);

    assert.equal(parsed.passed, true);
    assert.equal(parsed.results.length, 1);
  });
});

