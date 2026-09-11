# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Added

- Initial project setup.
- Release automation that validates one package tarball, publishes that exact
  artifact to npm with provenance, and attaches it to the GitHub release.

### Fixed

- Timeouts now terminate the full command process group on POSIX, with a
  documented 500 ms grace before forced termination.
- Invalid argv or environment values (such as null bytes) that make
  `spawn()` throw synchronously are now recorded as failed command
  receipts instead of aborting the run; normal mode continues to later
  commands, `--fail-fast` stops after writing the requested transcripts,
  and the CLI exits `1`.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/smokeroll/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/smokeroll/releases/latest`

Replace placeholder links once the first release tag exists.
