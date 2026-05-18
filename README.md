# SmokeRoll

SmokeRoll runs tiny CLI smoke checks from a checked-in manifest and writes
Markdown or JSON transcripts that prove the installed command still works.

It is deliberately smaller than a test framework: one manifest, explicit argv,
local execution, readable receipts.

## Install

\`\`\`sh
npm install
npm run build
\`\`\`

For local development, run the CLI directly from the built output:

\`\`\`sh
node dist/src/cli.js run examples/pass/smokeroll.json
\`\`\`

## Manifest

\`smokeroll.json\` contains a version and a list of commands:

\`\`\`json
{
  "version": 1,
  "commands": [
    {
      "name": "node can run a tiny script",
      "command": "node",
      "args": ["check.js"],
      "cwd": ".",
      "env": {
        "SMOKEROLL_EXAMPLE": "ready"
      },
      "expect": {
        "exitCode": 0,
        "stdoutContains": ["example ready"],
        "stderrContains": []
      },
      "timeoutMs": 5000
    }
  ]
}
\`\`\`

## Use

Print the plan without executing it:

\`\`\`sh
node dist/src/cli.js run examples/pass/smokeroll.json --dry-run
\`\`\`

Run the manifest and write transcripts:

\`\`\`sh
node dist/src/cli.js run examples/pass/smokeroll.json \\
  --transcript tmp/smoke.md \\
  --json tmp/smoke.json
\`\`\`

SmokeRoll exits \`0\` when every command passes and \`1\` when any expectation
fails. Manifest and usage errors also exit non-zero with a short error message.

## Safety Model

- Commands run through \`spawn(..., { shell: false })\`; there is no shell
  expansion or implicit pipe handling.
- \`command\` and \`args\` are explicit argv values.
- \`cwd\` resolves relative to the manifest directory.
- \`cwd\` must stay inside the manifest directory.
- Timeouts terminate long-running commands.

Review manifests from untrusted repositories before running them. SmokeRoll
reduces shell surprises, but it still executes local commands.

## Verify

\`\`\`sh
npm run check
npm test
npm run smoke
bash scripts/validate.sh
\`\`\`

The \`npm run smoke\` script writes \`tmp/smoke.md\` and \`tmp/smoke.json\`
from \`examples/pass/smokeroll.json\`.

## Repository Docs

- [Product requirements](docs/PRD.md)
- [Task ledger](docs/TASKS.md)
- [Orchestration](docs/ORCHESTRATION.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## License

MIT

