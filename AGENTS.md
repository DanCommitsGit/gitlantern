# AGENTS.md

## Where things go

- `README.md` is for people using gitlantern, and `CONTRIBUTING.md` holds development setup, checks and the release process.
- `ARCHITECTURE.md` is a short map of the main parts, their boundaries and the rules that hold everywhere. Update it when a boundary or one of those rules changes.
- `docs/decisions/` holds one record per choice the project owner has made that is hard to reverse or likely to be questioned. Name each file by its title, and add a record only after the owner has decided.
- Read the relevant decision record before changing something it covers. Don't rewrite an accepted record. Add a new one, and change the old record's status to `Superseded by <file>`.
- `DESIGN.md` holds the UI direction the owner picked. Add it when they pick one.
- Open work goes in GitHub issues. Rules the code can enforce go in a test, validation or lint rule.
- Plans, session summaries and audit reports don't belong in the repo.

## Commits

Use Conventional Commits. Only `feat` and `fix` commits produce a release, so land Electron security updates with a `fix:` subject.

## Traps

- After changing the Electron version, run `npm install` again, because the root `postinstall` is what downloads the binary.
- The renderer is still the template's demo screen, so don't copy its patterns.
- `child_process.fork` works in dev but throws in packaged builds, because the `runAsNode` fuse is off. Use `spawn` or a utility process.
- Tests of how git is found on Windows must delete `NoDefaultCurrentDirectoryInExePath` from `process.env` itself, because the search reads the parent's value and ignores a child's `env`. Claude Code's shell sets it, which hides a `git.exe` in the repo folder being run instead of real git.
