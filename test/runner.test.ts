import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadManifest } from "../src/manifest.js";
import { runPlan } from "../src/runner.js";

describe("runPlan", () => {
  it("passes the pass fixture", async () => {
    const result = await runPlan(await loadManifest("fixtures/pass/smokeroll.json"));

    assert.equal(result.passed, true);
    assert.equal(result.results[0]?.passed, true);
    assert.match(result.results[0]?.execution.stdout ?? "", /hello SmokeRoll/);
  });

  it("fails when expected output is missing", async () => {
    const result = await runPlan(await loadManifest("fixtures/fail/smokeroll.json"));

    assert.equal(result.passed, false);
    assert.equal(result.results[0]?.passed, false);
    assert.equal(
      result.results[0]?.assertions.some((assertion) => assertion.ok === false),
      true,
    );
  });

  it("marks timed out commands as failed", async () => {
    const result = await runPlan(await loadManifest("fixtures/timeout/smokeroll.json"));

    assert.equal(result.passed, false);
    assert.equal(result.results[0]?.execution.timedOut, true);
  });
});

