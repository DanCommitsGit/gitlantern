// Used by the main process to run an action, and by the renderer to preview it.

export interface GitAction {
  typedArguments: string[]
  gitArguments: string[]
  stdin?: string
  // True when what runs is different enough from what you'd type to show both.
  differsFromTyped?: boolean
}

const LITERAL_PATHS = '--literal-pathspecs'

export function stageFilesAction(paths: string[]): GitAction {
  return {
    typedArguments: ['add', ...paths],
    gitArguments: [LITERAL_PATHS, 'add', '--', ...paths]
  }
}

export function stageAllAction(): GitAction {
  return { typedArguments: ['add', '--all'], gitArguments: ['add', '--all'] }
}

// `git restore --staged` needs a commit to restore from, so a repository without one uses `git rm --cached`.
export function unstageFilesAction(paths: string[], hasCommits: boolean): GitAction {
  return hasCommits
    ? {
        typedArguments: ['restore', '--staged', ...paths],
        gitArguments: [LITERAL_PATHS, 'restore', '--staged', '--', ...paths]
      }
    : {
        typedArguments: ['rm', '--cached', ...paths],
        gitArguments: [LITERAL_PATHS, 'rm', '--cached', '--quiet', '--', ...paths]
      }
}

export function unstageAllAction(hasCommits: boolean): GitAction {
  return hasCommits
    ? {
        typedArguments: ['restore', '--staged', '.'],
        gitArguments: ['restore', '--staged', '.']
      }
    : {
        typedArguments: ['rm', '--cached', '-r', '.'],
        gitArguments: ['rm', '--cached', '-r', '--quiet', '.']
      }
}

export function commitAction(summary: string, description: string): GitAction {
  const trimmedDescription = description.trim()
  return {
    typedArguments: [
      'commit',
      '-m',
      summary,
      ...(trimmedDescription === '' ? [] : ['-m', trimmedDescription])
    ],
    gitArguments: ['commit', '-F', '-'],
    stdin: trimmedDescription === '' ? `${summary}\n` : `${summary}\n\n${trimmedDescription}\n`,
    differsFromTyped: true
  }
}

function quoteForDisplay(argument: string): string {
  return /^[\w@%+=:,./-]+$/.test(argument)
    ? argument
    : `"${argument.replace(/(["\\$`])/g, '\\$1')}"`
}

export function formatCommand(gitArguments: string[]): string {
  return ['git', ...gitArguments.map(quoteForDisplay)].join(' ')
}
