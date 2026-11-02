# Automate releases with release-please

Status: Accepted

## Context

Tags created with `GITHUB_TOKEN` don't trigger other workflows, and macOS runners cost about ten times as much per minute as Linux runners on GitHub Actions.

## Decision

Use release-please. The installers build in the same workflow run that creates the tag, and the release stays a draft until all three builds succeed. macOS builds run only for releases.

## Consequences

A macOS-only build problem doesn't show up until a release.
