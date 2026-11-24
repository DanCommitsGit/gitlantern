export interface CommandRecord {
    typedCommand: string
    ranCommand: string
    // Includes the repository path and safety flags.
    exactCommand: string
    differsFromTyped: boolean
    exitCode: number
    output: string
    finishedAt: number
}
