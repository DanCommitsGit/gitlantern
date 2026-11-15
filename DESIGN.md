# Design

## Layout

- The window has two views, Changes and History, with tabs in the top bar.
- A rail on the left holds branches, remotes and tags, and stays visible in both views.
- A new feature becomes a view or a rail group. Don't add a permanent pane for it.
- The diff gets all the width left over. In Changes that means a 230 px rail, a 320 px file pane, and the diff filling the rest.
- The window opens at 1360×840, and its minimum size is 960×600.
- The window's title bar and the app's top bar are one bar, with the system's own window buttons inside it.

## Commands

- A one-line strip along the bottom shows the command for whatever you point at, and opens into a history. It's always on, so the commands can't be hidden by accident.
- A setting adds a card at the button with the command and what it does.
- When what you'd type differs from what ran, show both lines.
- A click runs its command right away. Only actions that can lose work ask first.

## Changes

- Files appear in two lists, Unstaged and Staged, by default. A half-staged file is in both.
- A setting swaps them for one list with checkboxes.
- The commit form is docked under the file lists.

## Diffs

- Diffs are unified by default. Buttons above the diff switch between Unified, Split and Words, and the last one picked stays for every file and the next launch.
- Split puts the old and new file side by side, with each changed line across from its new version. In a window too narrow for it, the diff shows as Unified.
- Split lines up and marks changes with VS Code's diff matching, inside each of git's hunks. Unified keeps git's line order and marks the same text.
- Words shows each changed line once, with removed words struck through and added words marked.
- A diff that reaches the end of a file ends with the empty line after its last line break, the way an editor shows it.

## Hints

- Hover or keyboard focus on a term shows a card with one sentence and its command.

## First launch

- A welcome screen offers Open, Create and recent repos, with no setup wizard. Clone joins them when sync exists.

## Settings

- Settings open in a dialog from the icon at the right end of the title bar.
- A sidebar lists the sections, and the panel shows the selected one.

## Look

- The app follows the system's light or dark theme.
- Gold marks only the command layer and HEAD. The focus ring is ink, not gold.
- Text is IBM Plex Sans and code is IBM Plex Mono, both bundled with the app.

## Options

Each option has one clear default, and the app works fully without changing it.
