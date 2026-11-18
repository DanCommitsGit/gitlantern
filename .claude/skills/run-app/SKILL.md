---
name: run-app
description: Build GitLantern, open a repository in it and drive the window with Playwright to click, type and take screenshots. Use when asked to run or screenshot the app, or to check a renderer change in the real app rather than only in tests.
---

# Run GitLantern

`drive.mts` launches the built app with Playwright, opens a repository through the welcome screen's Open button, runs the commands it is given in order, and closes the app. Each run uses a new Electron profile, so it never reads or changes the real settings or trusted repositories.

## Run it

```bash
npx electron-vite build
node .claude/skills/run-app/drive.mts --out <folder> "click History" "screenshot history"
```

Build again after every source change, since the driver runs `out/`, not the dev server.

- `--repo <folder>` is the repository to open. It defaults to this checkout.
- `--out <folder>` is where screenshots and profiles go. It defaults to `gitlantern-run` in the system temp folder.

Then open the screenshots and look at them. The last line, `page errors:`, lists console errors and uncaught exceptions from the window.

The driver is TypeScript, which Node 24 runs directly.

## Commands

Each command is one argument, a name and what follows the first space. While a dialog is open, `click`, `fill` and `check` look inside it first, so the Settings dialog's History section wins over the History tab behind it.

| Command                              | Does                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| `click <name>`                       | Clicks the button or link with that text or `aria-label`.            |
| `fill <label or placeholder>=<text>` | Types into a text box, such as `fill Summary=Fix the parser`.        |
| `check <label>`                      | Checks a checkbox or radio button, such as `check Right of the log`. |
| `press <key>`                        | Presses a key, such as `press Escape`.                               |
| `wait <milliseconds>`                | Waits.                                                               |
| `screenshot <name>`                  | Saves `<name>.png` in the output folder.                             |
| `text [css selector]`                | Prints the text of the first visible match, or of the whole window.  |
| `eval <expression>`                  | Runs JavaScript in the window and prints the result as JSON.         |

## Traps

- Changes and History both stay mounted, and the hidden one is still in the page. Role and label lookups skip hidden elements, but a CSS selector needs `:visible`, which `text` adds.
- A repository with hooks, or with settings that run a program such as `core.sshCommand`, opens the trust dialog first. The driver says so after opening, and `click` can answer it.
- Theme colors in `@theme` reach the CSS only when a utility uses them, so a color set through a `var()` in `style` can be missing at runtime while every check passes. Screenshots catch this.
