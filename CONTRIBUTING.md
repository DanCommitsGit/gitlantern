# Contributing

## Development

You need Node.js 24 (see `.nvmrc`) and git.

```bash
npm install
npm run dev
```

[ARCHITECTURE.md](ARCHITECTURE.md) describes how the app is put together, [docs/decisions](docs/decisions/) records why it's built this way, and [AGENTS.md](AGENTS.md) contains guidance for agents.

## Checks

Run these before pushing. CI runs the same checks.

```bash
npx prettier --check .
npm run lint
npm run typecheck
npm test
```

## Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please-action) and depend on [Conventional Commits](https://www.conventionalcommits.org/).

1. Each `feat` or `fix` commit on `main` updates an open Release PR with the next version and changelog.
2. Merging the Release PR tags the release and starts the Windows, macOS and Linux builds.
3. The release is published once all three builds succeed. If a build fails, the release stays a draft until the failed job is re-run.

CI doesn't run on the Release PR, because pull requests opened by `GITHUB_TOKEN` don't trigger it automatically.
