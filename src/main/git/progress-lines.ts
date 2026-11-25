/** The output as a terminal would show it: text after a carriage return replaces the line so far. */
export function withoutOverwrittenText(output: string): string {
    return output
        .split('\n')
        .map((line) => line.replace(/\r+$/, '').split('\r').at(-1))
        .join('\n')
}

/**
 * Git redraws a progress line by ending it with a carriage return. The returned function takes output as
 * it arrives and reports the newest finished line, never one cut off by the end of a chunk.
 */
export function createProgressLines(onLine: (line: string) => void): (chunk: string) => void {
    let unfinishedLine = ''
    return (chunk) => {
        const lines = (unfinishedLine + chunk).split(/[\r\n]+/)
        unfinishedLine = lines.pop() ?? ''
        const newestLine = lines.findLast((line) => line !== '')
        if (newestLine !== undefined) onLine(newestLine)
    }
}
