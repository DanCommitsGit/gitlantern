# Run the real git binary

Status: Accepted

## Context

Running the installed git picks up the user's existing settings, credentials, SSH setup and hooks.

Repos, ref names and remote URLs can be written by an attacker, and passing arguments with no shell doesn't make them safe. On Windows, `spawn('git', args, { cwd: repo })` runs a `git.exe` committed to the repo, and a branch named `--output=x` passed to `git log` is parsed as a flag and writes a file.

## Decision

Run the git binary from the main process, with these rules:

- Resolve git's absolute path once at startup from a safe folder, and always spawn that path.
- Pass the repo with `-C` instead of `cwd`.
- Pass arguments as an array with no shell.
- Put `--end-of-options` before every revision argument.

## Consequences

Users need git installed, and behavior can vary with their git version. Git settings in a repo's `.git/config` can still run programs during ordinary reads such as `git status`, so opening an untrusted repo needs its own protection.
