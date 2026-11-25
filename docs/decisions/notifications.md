# Notifications for window-wide errors and warnings

Status: Accepted

## Context

Errors and warnings were each shown in a hand-built banner holding one string, so a newer message overwrote an older one and nothing kept a history.

## Decision

The main process keeps one list of notifications, each with a severity (error or warning), a message and a time. The main process and the window both raise into it. A bell button in the title bar, before Settings, opens a popover that lists them, newest first, with a count badge colored by the worst severity.

- The newest notification also shows as a dismissible banner under the title bar. Dismissing the banner keeps the notification in the list.
- A notification can carry a source, such as the repository status read. A new notification from the same source replaces the earlier one, unless it has the same severity and message, in which case the earlier one stays. A later success from the source resolves it, which removes the notification. Without a source, raising the same severity and message again replaces the earlier notification.
- These use a source: the app data and settings warnings, the status read, the diff read, the git check, and Fetch, Pull and Push failures, which share one source. Only the status read, diff read, git check and sync sources resolve, when the next read, git check or Fetch, Pull or Push succeeds. A failed commit or another one-off action has no source.
- The list is kept in memory, so it is empty after a restart, and it holds the newest 5000.
- Window-wide problems use notifications: the warnings about app data and settings, repository read errors, Fetch, Pull and Push failures, and the git check failure.
- Problems about one pane or dialog stay inline next to what failed: the commit form, the commit log, commit detail, the Welcome screen's open failure and the Settings save error.

## Consequences

A notification from the status read, diff read, git check or Fetch, Pull and Push disappears when a later attempt succeeds, so it can vanish without being dismissed. Any other notification stays until it is dismissed, replaced, or pushed out by newer ones.
