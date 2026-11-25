import { execFile } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DEFAULT_TIMEOUT_MILLISECONDS = 30_000
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024

export interface GitCommand {
    gitPath: string
    repositoryPath?: string
    gitArguments: string[]
    stdin?: string
    timeoutMilliseconds?: number
    signal?: AbortSignal
    environment?: NodeJS.ProcessEnv
    /** Called with each piece of stderr as it arrives, before the command finishes. */
    onStderr?: (chunk: string) => void
}

export interface GitResult {
    fullArguments: string[]
    exitCode: number
    stdout: Buffer
    stderr: Buffer
}

function isExitFailure(error: unknown): error is { code: number; stdout: Buffer; stderr: Buffer } {
    return typeof (error as { code?: unknown }).code === 'number'
}

// Resolves for any exit code, and rejects when git can't start, times out, is cancelled or exceeds the output limit.
export async function runGit(command: GitCommand): Promise<GitResult> {
    const fullArguments = [
        ...(command.repositoryPath === undefined ? [] : ['-C', command.repositoryPath]),
        '-c',
        'safe.bareRepository=explicit',
        ...command.gitArguments
    ]

    const pendingResult = execFileAsync(command.gitPath, fullArguments, {
        encoding: 'buffer',
        windowsHide: true,
        timeout: command.timeoutMilliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS,
        maxBuffer: MAX_OUTPUT_BYTES,
        signal: command.signal,
        env: command.environment
    })
    pendingResult.child.stdin?.end(command.stdin)
    const { onStderr } = command
    if (onStderr !== undefined) {
        // A chunk can end partway through a character.
        const decoder = new StringDecoder('utf8')
        pendingResult.child.stderr?.on('data', (chunk: Buffer) => onStderr(decoder.write(chunk)))
    }

    try {
        const { stdout, stderr } = await pendingResult
        return { fullArguments, exitCode: 0, stdout, stderr }
    } catch (error) {
        if (!isExitFailure(error)) throw error
        return { fullArguments, exitCode: error.code, stdout: error.stdout, stderr: error.stderr }
    }
}
