import { accessSync, constants, statSync } from 'node:fs'
import { delimiter, isAbsolute, join } from 'node:path'

function isExecutableFile(filePath: string): boolean {
  try {
    accessSync(filePath, constants.X_OK)
    return statSync(filePath).isFile()
  } catch {
    return false
  }
}

// Relative PATH entries are skipped because they resolve against the current folder.
// shortcut: apps started from the macOS Finder get a minimal PATH, which misses Homebrew's git. Search known folders when this reaches Mac testing.
export function findGitPath(searchPath: string = process.env['PATH'] ?? ''): string | null {
  const executableName = process.platform === 'win32' ? 'git.exe' : 'git'

  for (const folder of searchPath.split(delimiter)) {
    if (!isAbsolute(folder)) continue
    const gitPath = join(folder, executableName)
    if (isExecutableFile(gitPath)) return gitPath
  }

  return null
}
