# Design

## Layout

- The window has two views, Changes and History, with tabs in the top bar.
- A repository sidebar on the left holds branches, remotes and tags, and stays visible in both views.
- A new feature becomes a view or a group in the repository sidebar. Don't add a permanent pane for it.
- The diff gets all the width left over. In Changes that means a 230 px repository sidebar, a 320 px file pane, and the diff filling the rest.
- The window opens at 1360×840, and its minimum size is 960×600.
- The window's title bar and the app's top bar are one bar, with the system's own window buttons inside it.

## Commands

- A one-line strip along the bottom shows the command for whatever you point at, and opens into a history. It's always on, so the commands can't be hidden by accident.
- A setting adds a card at the button with the command and what it does.
- When what you'd type differs from what ran, show both lines.
- A click runs its command right away. Only actions that can lose work ask first.

## Changes

- Files appear in two lists, Unstaged and Staged, by default. A half-staged file is in both.
- A setting swaps them for one list with checkboxes. There, a half-staged file shows a dash and Part, and clicking the dash stages the rest. A fully staged file shows its staged changes, and any other file its unstaged ones. The commit button says how many files go in.
- The commit form is docked under the file lists.

## History

- The log is a table of commits with a lane graph beside it, the way `git log --graph` draws one. A setting hides the graph and leaves the plain table.
- Buttons above the log show all branches, this branch, or first parents only, and a search box matches the message, author or commit.
- More commits load as you scroll to the end of the log.
- Selecting a commit shows its message, its changed files and the diff of one file, picked from the list as in Changes. A setting puts this under the log or to the right of it.

## Branches

- The repository sidebar lists local branches in one list by default, with HEAD on the current one.
- A setting groups them by the part before the first slash. Branches without one come first, and collapsed groups stay collapsed for that repository.
- A setting orders them current branch first and then by name, which is the default, by name, or newest commit first.
- Each branch shows how many commits it is ahead of and behind its upstream.

## Diffs

- Diffs are unified by default. Buttons above the diff switch between Unified, Split and Words, and the last one picked stays for every file and the next launch.
- Split puts the old and new file side by side, with each changed line across from its new version. In a window too narrow for it, the diff shows as Unified.
- Split lines up and marks changes with VS Code's diff matching, inside each of git's hunks. Unified keeps git's line order and marks the same text.
- Words shows each changed line once, with removed words struck through and added words marked.
- A diff that reaches the end of a file ends with the empty line after its last line break, the way an editor shows it.

## Hints

- Hover or keyboard focus on a term shows a card with one sentence and its command.

## First launch

- A welcome screen offers Open, Create, Clone and recent repos, with no setup wizard.
- Clone opens a dialog with a URL field and a parent folder to clone into. It shows the full path of the new folder and the `git clone` command. The dialog can't be closed while git runs. A failure stays in the dialog with git's message and the fields as they were. On success the repository opens and the command goes into the command history.
- The app opens the repository that was open when it last quit. It shows the welcome screen when none was open, the repository can't be opened, or it needs trust. The Startup settings section can switch this to always showing the welcome screen.

## Settings

- Settings open in a dialog from the icon at the right end of the title bar.
- A sidebar lists the sections, and the panel shows the selected one.

## Updates

- Updates have their own settings section, with the version, a button to check, and a switch for updating automatically, which is on by default.
- A button appears in the title bar, left of the settings icon, only when an update is waiting. It restarts the app when the update is downloaded, and otherwise opens the Updates section.
- On macOS the app only checks and links to the download page.

## Look

- The app follows the system's light or dark theme unless the theme setting in the Appearance section is set to light or dark.
- Gold marks only the command layer and HEAD. The focus ring is ink, not gold.
- Text is IBM Plex Sans and code is IBM Plex Mono, both bundled with the app.

## Options

Each option has one clear default, and the app works fully without changing it.
