# Architecture

gitlantern is an Electron app with a main process (`src/main`), a preload script (`src/preload`) and a React renderer (`src/renderer`).

The renderer is sandboxed, so all git and operating system access has to happen in the main process. The renderer reaches the main process only through `window.api`, which the preload script defines.
