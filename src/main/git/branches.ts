import type { Branch } from '../../shared/repository-types'
import { runGit } from './run-git'

const BRANCH_FIELDS = ['%(refname)', '%(upstream:track,nobracket)', '%(committerdate:unix)']

function trackCount(track: string, word: 'ahead' | 'behind'): number {
    const match = new RegExp(`${word} (\\d+)`).exec(track)
    return match === null ? 0 : Number(match[1])
}

// Reads one line per branch, such as "refs/heads/main\0ahead 2, behind 1\01767225600".
export function parseBranches(output: string): Branch[] {
    return output
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => {
            const [refName, track, committedAt] = line.split('\0')
            return {
                name: refName.slice('refs/heads/'.length),
                ahead: trackCount(track, 'ahead'),
                behind: trackCount(track, 'behind'),
                committedAt: Number(committedAt)
            }
        })
}

export async function readBranches(repository: {
    gitPath: string
    repositoryPath: string
}): Promise<Branch[]> {
    const result = await runGit({
        ...repository,
        gitArguments: [
            '--no-optional-locks',
            'for-each-ref',
            `--format=${BRANCH_FIELDS.join('%00')}`,
            'refs/heads/'
        ],
        // The ahead and behind words are translated, and they're matched above.
        environment: { ...process.env, LC_ALL: 'C' }
    })
    if (result.exitCode !== 0) throw new Error(result.stderr.toString().trim())

    return parseBranches(result.stdout.toString())
}
