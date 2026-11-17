# Architecture

gitlantern is an Electron app with a main process (`src/main`), a preload script (`src/preload`) and a React renderer (`src/renderer`).

The renderer is sandboxed, so all git and operating system access has to happen in the main process. The renderer reaches the main process only through `window.api`, which the preload script defines. Every handler checks the sender's origin and validates its arguments, and logs any failure to `main.log` without the arguments. Logging uses `electron-log/node`, because the package's other entries register IPC listeners that skip the origin check, and a lint rule enforces this. The renderer asks for named actions and never sends git arguments, and the main process keeps track of which repository is open. Code both sides need lives in `src/shared`.

All git commands run through `runGit` in `src/main/git`, which doesn't import Electron, so it can be tested with plain Vitest. A repository's programs are checked with `findRepositoryPrograms` before any other command runs in it.

Updates come from the project's GitHub releases through `electron-updater`. The rules for what to do with one live in `src/main/updater.ts`, which doesn't import Electron, and the main process pushes each status change to the renderer.

In production the renderer loads from `app://-`, which `electron-serve` limits to the renderer's build output. It can't navigate to another origin, and only `http:` and `https:` links open outside the app.
