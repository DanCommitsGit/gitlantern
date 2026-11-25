import { existsSync } from 'node:fs'
import { StringDecoder } from 'node:string_decoder'
import { execa } from 'execa'
import { closeOutputAfterStop } from './close-output-after-stop'

const DEFAULT_TIMEOUT_MILLISECONDS = 30_000
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024

export interface GitCommand {
    gitPath: string
    repositoryPath?: string
    gitArguments: string[]
    stdin?: string
    /** Git's time limit. It defaults to 30 seconds, and 0 means no limit. */
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

function isProgramFile(filePath: string): boolean {
    return /\.(com|exe)$/i.test(filePath) && existsSync(filePath)
}

// Resolves for any exit code, and rejects when git can't start, times out, is cancelled or exceeds the output limit.
export async function runGit(command: GitCommand): Promise<GitResult> {
    const fullArguments = [
        ...(command.repositoryPath === undefined ? [] : ['-C', command.repositoryPath]),
        '-c',
        'safe.bareRepository=explicit',
        ...command.gitArguments
    ]

    command.signal?.throwIfAborted()
    // On Windows, execa hands cmd.exe anything that isn't an existing program file, and a missing git would
    // then look like a git command that failed.
    if (process.platform === 'win32' && !isProgramFile(command.gitPath)) {
        throw new Error(`Not a program that can be run: ${command.gitPath}`)
    }
    const timeoutMilliseconds = command.timeoutMilliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS
    const subprocess = execa(command.gitPath, fullArguments, {
        encoding: 'buffer',
        stripFinalNewline: false,
        input: command.stdin ?? '',
        env: command.environment,
        maxBuffer: MAX_OUTPUT_BYTES,
        timeout: timeoutMilliseconds,
        cancelSignal: command.signal,
        // Stopping git alone would leave the programs that git started running.
        killDescendants: true,
        // Keeps execa from stopping git when the app quits.
        cleanup: false,
        reject: false
    })
    // execa reports a timeout only once the command has ended, so closeOutputAfterStop gets a timer of its own.
    const stopSignals = [
        command.signal,
        timeoutMilliseconds > 0 ? AbortSignal.timeout(timeoutMilliseconds) : undefined
    ].filter((signal) => signal !== undefined)
    closeOutputAfterStop(subprocess.nodeChildProcess, AbortSignal.any(stopSignals))
    const { onStderr } = command
    if (onStderr !== undefined) {
        // A chunk can end partway through a character.
        const decoder = new StringDecoder('utf8')
        subprocess.stderr.on('data', (chunk: Buffer) => onStderr(decoder.write(chunk)))
    }

    const result = await subprocess
    if (result.failed) {
        command.signal?.throwIfAborted()
        // Git didn't start, hit a limit, or was ended by a signal.
        if (result.timedOut || result.isMaxBuffer || result.exitCode === undefined) throw result
    }
    return {
        fullArguments,
        exitCode: result.exitCode ?? 0,
        stdout: Buffer.from(result.stdout),
        stderr: Buffer.from(result.stderr)
    }
}
