# Commit types for dependency updates

Status: Accepted

## Context

release-please cuts a release only for `feat` and `fix` commits. Electron and the packages bundled into the app ship inside the installer, so their security fixes reach users only through a new release. Development tools such as Vite, Vitest, ESLint and TypeScript don't change what users run.

## Decision

Give a dependency update a `fix:` subject when it changes what ships in the app, such as Electron, electron-store or Base UI. Give it a `build:` subject when it only changes development tools. A Dependabot pull request that mixes both is retitled `fix:` before it lands.

## Consequences

An update to a shipped package produces a patch release even when it fixes nothing users would notice.
