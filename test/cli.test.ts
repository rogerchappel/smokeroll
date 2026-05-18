import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { main } from "../src/cli.js";

describe("cli", () => {
  it("returns success for dry-run", async () => {
    const exitCode = await main(["run", "fixtures/pass/smokeroll.json", "--dry-run"]);

    assert.equal(exitCode, 0);
  });

  it("returns failure for failing fixtures", async () => {
    const exitCode = await main(["run", "fixtures/fail/smokeroll.json"]);

    assert.equal(exitCode, 1);
  });
});

