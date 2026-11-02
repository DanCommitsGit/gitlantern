# Architecture

gitlantern is an Electron app with a main process (`src/main`), a preload script (`src/preload`) and a React renderer (`src/renderer`).

The renderer is sandboxed, so all git and operating system access has to happen in the main process. The renderer reaches the main process only through `window.api`, which the preload script defines.

All git commands run through `runGit` in `src/main/git`, which doesn't import Electron, so it can be tested with plain Vitest. A repository's programs are checked with `findRepositoryPrograms` before any other command runs in it.

In production the renderer loads from `app://-`, which `electron-serve` limits to the renderer's build output. It can't navigate to another origin, and only `http:` and `https:` links open outside the app.
