# Security Policy

SmokeRoll executes local commands from a checked-in manifest. Treat manifests
from untrusted repositories like any other local automation.

## Supported Versions

Until SmokeRoll declares a stable release line, only the default branch is
expected to receive security fixes.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately through GitHub Security
Advisories when available. If advisories are not enabled, open a minimal public
issue that asks for a private reporting path without including exploit details,
secrets, personal data, or sensitive technical details.

## Security Expectations

- Manifests must use explicit \`command\` and \`args\`; SmokeRoll does not invoke a
  shell.
- Command \`cwd\` values are contained inside the manifest directory.
- Transcript files may contain stdout and stderr. Do not run manifests that print
  secrets unless the transcript destination is private.
- Environment variables declared in a manifest are visible to the child process.

## What to Include

When a private reporting path is available, include:

- A clear description of the issue.
- Affected versions, files, packages, workflows, or configuration.
- Steps to reproduce or a proof of concept when safe to share.
- Potential impact.
- Suggested mitigation, if known.

