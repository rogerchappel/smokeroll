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

  for (const exitCode of [0, 255]) {
    it(`accepts expected exit code ${exitCode}`, () => {
      const manifest = validateManifest({
        version: 1,
        commands: [{ name: "boundary", command: "node", expect: { exitCode } }],
      });

      assert.equal(manifest.commands[0]?.expect?.exitCode, exitCode);
    });
  }

  for (const exitCode of [-1, 256, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    it(`rejects unsupported expected exit code ${exitCode}`, () => {
      assert.throws(
        () => validateManifest({
          version: 1,
          commands: [{ name: "invalid", command: "node", expect: { exitCode } }],
        }),
        /commands\[0\]\.expect\.exitCode must be an integer from 0 to 255/,
      );
    });
  }

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
