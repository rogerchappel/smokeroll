import assert from "node:assert/strict";
import { describe, it } from "node:test";
import path from "node:path";
import { ManifestError } from "../src/errors.js";
import { loadManifest, validateManifest } from "../src/manifest.js";

describe("manifest validation", () => {
  it("accepts a minimal manifest", () => {
    const manifest = validateManifest({
      version: 1,
      commands: [{ name: "ok", command: "node" }],
    });

    assert.equal(manifest.commands[0]?.name, "ok");
  });

  it("rejects empty command lists", () => {
    assert.throws(() => validateManifest({ version: 1, commands: [] }), ManifestError);
  });

  it("resolves fixture command defaults", async () => {
    const plan = await loadManifest("fixtures/pass/smokeroll.json");
    const command = plan.commands[0];

    assert.ok(command);
    assert.equal(command.expect.exitCode, 0);
    assert.deepEqual(command.args, ["hello.js"]);
    assert.equal(command.timeoutMs, 5000);
    assert.equal(command.cwd, path.resolve("fixtures/pass"));
  });
});

