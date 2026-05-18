# SmokeRoll Tasks

## MVP

- [x] Define a checked-in `smokeroll.json` manifest format.
- [x] Validate command names, argv, cwd, env, expectations, and timeouts.
- [x] Execute commands without invoking a shell.
- [x] Resolve fixture paths relative to the manifest location.
- [x] Support expected exit code, stdout contains, and stderr contains.
- [x] Handle command timeouts.
- [x] Print dry-run plans.
- [x] Write Markdown transcripts.
- [x] Write JSON transcripts.
- [x] Include pass, fail, and timeout fixtures.
- [x] Include a real CLI smoke command.
- [x] Document install, usage, safety, and contribution flow.

## Post-MVP

- [ ] Add optional JSON schema publishing.
- [ ] Add elapsed-time thresholds separate from hard timeouts.
- [ ] Add transcript redaction rules for sensitive environment values.
- [ ] Add GitHub Action examples for release smoke receipts.

