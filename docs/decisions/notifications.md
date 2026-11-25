# Notifications for window-wide errors and warnings

Status: Accepted

## Context

Errors and warnings were each shown in a hand-built banner holding one string, so a newer message overwrote an older one and nothing kept a history.

## Decision

The main process keeps one list of notifications, each with a severity (error or warning), a message and a time. The main process and the window both raise into it. A bell button in the title bar, before Settings, opens a popover that lists them, newest first, with a count badge colored by the worst severity.

- The newest notification also shows as a dismissible banner under the title bar. Dismissing the banner keeps the notification in the list.
- Raising the same severity and message again replaces the earlier notification.
- The list is kept in memory, so it is empty after a restart, and it holds the newest 5000.
- Window-wide problems use notifications: the warnings about app data and settings, repository read errors, Fetch, Pull and Push failures, and the git check failure.
- Problems about one pane or dialog stay inline next to what failed: the commit form, the commit log, commit detail, the Welcome screen's open failure and the Settings save error.

## Consequences

A read error no longer clears itself when the next read succeeds, and a successful Fetch, Pull or Push no longer clears an earlier failure. Each failure stays in the list until dismissed, replaced by the same message, or pushed out by newer ones.
