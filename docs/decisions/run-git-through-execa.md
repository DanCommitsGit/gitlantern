# Run git through execa

Status: Accepted

## Context

Git starts other programs, such as `git-remote-https`, hooks and filters. When Node's `execFile` stops git on a cancel, a time limit or too much output, it signals only git, and those programs can keep running. Stopping them too takes `taskkill /T` on Windows, or on Linux and macOS a process group, which `execFile` can't create.

## Decision

`runGit` runs git through `execa` with `killDescendants`, which does both.

On Windows, `runGit` refuses a git path that isn't an existing `.exe` or `.com` file, because `execa` would run it through `cmd.exe`, and git [runs with no shell](run-real-git-binary.md).

After a cancel or time limit, `runGit` closes git's output once git exits, because a program that is still running can hold it open.

## Consequences

The app ships `execa` and the packages it depends on.

On Windows, a program that git starts through `sh.exe` can still keep running.

On Linux and macOS, git runs in its own session. A background program that stays in git's process group, such as the credential cache, can be stopped along with git, and a program that git starts can't ask for input on the terminal the app was started from.
