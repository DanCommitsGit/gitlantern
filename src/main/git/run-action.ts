import { formatCommand, type GitAction } from '../../shared/git-actions'
import type { CommandRecord } from '../../shared/command-record'
import { createProgressLines, withoutOverwrittenText } from './progress-lines'
import { runGit } from './run-git'

// Hooks during a commit, and slow remotes during fetch, pull and push, can run for a while.
const ACTION_TIMEOUT_MILLISECONDS = 10 * 60 * 1000

export interface RunActionOptions {
    /** Called with the newest line of git's progress output while the action runs. */
    onProgress?: (line: string) => void
}

export async function runAction(
    repository: { gitPath: string; repositoryPath?: string },
    action: GitAction,
    options: RunActionOptions = {}
): Promise<CommandRecord> {
    const result = await runGit({
        ...repository,
        gitArguments: action.gitArguments,
        stdin: action.stdin,
        timeoutMilliseconds: ACTION_TIMEOUT_MILLISECONDS,
        onStderr: options.onProgress === undefined ? undefined : createProgressLines(options.onProgress),
        // With no terminal to type into, git fails instead of waiting for a password.
        environment: action.contactsRemote ? { ...process.env, GIT_TERMINAL_PROMPT: '0' } : undefined
    })

    return {
        typedCommand: formatCommand(action.typedArguments),
        ranCommand: formatCommand(action.gitArguments),
        exactCommand: formatCommand(result.fullArguments),
        differsFromTyped: action.differsFromTyped === true,
        exitCode: result.exitCode,
        output: withoutOverwrittenText(`${result.stdout.toString()}${result.stderr.toString()}`).trim(),
        finishedAt: Date.now()
    }
}
