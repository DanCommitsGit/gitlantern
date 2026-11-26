# Architecture

GitLantern is an Electron app with a main process (`src/main`), a preload script (`src/preload`) and a React renderer (`src/renderer`).

The renderer is sandboxed, so all git and operating system access has to happen in the main process. The renderer reaches the main process only through `window.api`, which the preload script defines. Every handler checks the sender's origin and validates its arguments, and logs any failure to `main.log` without the arguments. Logging uses `electron-log/node`, because the package's other entries register IPC listeners that skip the origin check, and a lint rule enforces this. Errors nothing else catches are logged too. The renderer sends the text of its errors through `window.api` to be logged, and the main process logs its own errors and other processes' unexpected exits. The renderer asks for named actions and never sends git arguments, and the main process keeps track of which repository is open. Code both sides need lives in `src/shared`.

All git commands run through `runGit` in `src/main/git`, which doesn't import Electron, so it can be tested with plain Vitest. A repository's programs are checked with `findRepositoryPrograms` before any other command runs in it.

Updates come from the project's GitHub releases through `electron-updater`. The rules for what to do with one live in `src/main/updater.ts`, which doesn't import Electron, and the main process pushes each status change to the renderer.

Persisted data lives in two files in Electron's `userData` folder, which the main process opens through `createRepairedStore` so each value is checked when the file is read and reset if it's invalid. `settings.json` holds the user's preferences, and the renderer doesn't use `localStorage`. If it can't be opened, the app uses the defaults, refuses changes and raises a notice. `config.json` holds the recent repositories, the repository open when the app last quit, the programs the user trusted and the branch groups collapsed in each repository, and the git location. If `config.json` can't be written, the app keeps these in memory until it closes and raises a notice. GitLantern keeps no copy of git data, the git identity is written to the global git config, and update status is held in memory.

The main process keeps the list of notices the window shows, such as these, and pushes each change to the renderer, which shows them as banners under the title bar until the user dismisses them.

In production the renderer loads from `app://-`, which `electron-serve` limits to the renderer's build output. It can't navigate to another origin, and only `http:` and `https:` links open outside the app.
