// Used by the main process to run an action, and by the renderer to preview it.

export interface GitAction {
    typedArguments: string[]
    gitArguments: string[]
    stdin?: string
    // True when what runs is different enough from what you'd type to show both.
    differsFromTyped?: boolean
    // True when git talks to a remote, where it could stop to ask for a password.
    contactsRemote?: boolean
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

export function fetchAction(): GitAction {
    return {
        typedArguments: ['fetch', '--all'],
        gitArguments: ['fetch', '--all'],
        contactsRemote: true
    }
}

export const PULL_MODES = ['fast-forward-only', 'merge', 'rebase'] as const

export type PullMode = (typeof PULL_MODES)[number]

const PULL_OPTIONS: Record<PullMode, string> = {
    'fast-forward-only': '--ff-only',
    merge: '--no-rebase',
    rebase: '--rebase'
}

export function pullAction(mode: PullMode): GitAction {
    const gitArguments = ['pull', PULL_OPTIONS[mode]]
    return { typedArguments: gitArguments, gitArguments, contactsRemote: true }
}

export interface PublishTarget {
    remote: string
    branchName: string
}

// Without a target, the branch already has an upstream to push to.
export function pushAction(publishTarget: PublishTarget | null): GitAction {
    return publishTarget === null
        ? { typedArguments: ['push'], gitArguments: ['push'], contactsRemote: true }
        : {
              typedArguments: ['push', '-u', publishTarget.remote, publishTarget.branchName],
              gitArguments: ['push', '-u', '--', publishTarget.remote, publishTarget.branchName],
              contactsRemote: true
          }
}

// --progress makes git report progress when its output isn't a terminal.
export function cloneAction(url: string, destination: string): GitAction {
    return {
        typedArguments: ['clone', url, destination],
        gitArguments: ['clone', '--progress', '--', url, destination],
        contactsRemote: true
    }
}

export function initAction(): GitAction {
    return { typedArguments: ['init'], gitArguments: ['init'] }
}

export function saveIdentityActions(name: string, email: string): GitAction[] {
    return [
        {
            typedArguments: ['config', '--global', 'user.name', name],
            gitArguments: ['config', '--global', '--', 'user.name', name]
        },
        {
            typedArguments: ['config', '--global', 'user.email', email],
            gitArguments: ['config', '--global', '--', 'user.email', email]
        }
    ]
}

function quoteForDisplay(argument: string): string {
    return /^[\w@%+=:,./-]+$/.test(argument) ? argument : `"${argument.replace(/(["\\$`])/g, '\\$1')}"`
}

export function formatCommand(gitArguments: string[]): string {
    return ['git', ...gitArguments.map(quoteForDisplay)].join(' ')
}
