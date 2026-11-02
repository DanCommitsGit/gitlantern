# Sandbox the renderer

Status: Accepted

## Context

The renderer will display text that other people wrote, such as commit messages, branch names and diffs. The electron-vite template doesn't sandbox the renderer, and its `@electron-toolkit/preload` package can't load in a sandboxed preload.

## Decision

Set `sandbox: true`, remove `@electron-toolkit/preload`, and expose only narrow functions to the renderer as `window.api`.
