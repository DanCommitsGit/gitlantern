# Check a repository's settings before running git in it

Status: Accepted

## Context

A repository's `.git/config` and hooks can run programs during ordinary reads. `core.fsmonitor` and the `post-index-change` hook run on `git status`, and filter and diff drivers run on `git diff`. A clone doesn't copy `.git/config`, but a zip or a copied folder does.

Passing `-c` overrides can't block this, because an attacker chooses the driver names, and no tested flag stops `filter.<name>.clean` or `diff.<name>.textconv`. A restricted mode would have to hide diffs.

## Decision

Before any other git command runs in a repository, read its settings with `git config --list --show-scope --show-origin -z` and list its hooks. Neither runs the repository's programs.

If a local or worktree setting can run a program, or a hook other than a sample exists, list them and ask whether to open the repository. Remember the answer until that list changes. Otherwise open it with no prompt.

Every command also passes `-c safe.bareRepository=explicit`, so a bare repository committed inside a clone isn't picked up.

## Consequences

Repositories that use a hook manager or local LFS hooks get one prompt. The setting names are a list we maintain, so a program setting added to a future git version won't be flagged until we add it. A global or system setting is the user's own and is never flagged.
