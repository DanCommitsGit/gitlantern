import type { ChildProcess } from 'node:child_process'

/**
 * Once the signal has aborted and the process has exited, closes the process's output pipes. A program
 * that the process started and that outlives it would otherwise hold them open, and execa would wait until
 * that program ends.
 */
export function closeOutputAfterStop(child: ChildProcess, signal: AbortSignal): void {
    const close = (): void => {
        child.stdout?.destroy()
        child.stderr?.destroy()
    }
    const closeAfterExit = (): void => {
        if (child.exitCode !== null || child.signalCode !== null) close()
        else child.once('exit', close)
    }
    signal.addEventListener('abort', closeAfterExit, { once: true })
    child.once('close', () => signal.removeEventListener('abort', closeAfterExit))
}
