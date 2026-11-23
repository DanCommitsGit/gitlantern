import type { FileChange, FileStatus, RepositoryStatus } from '../../shared/repository-types'
import { runGit } from './run-git'

// Number of space-separated fields before the path in each porcelain v2 entry type.
const FIELDS_BEFORE_PATH = { ordinary: 8, renamed: 9, unmerged: 10 }

function pathAfterFields(entry: string, fieldCount: number): string {
    return entry.split(' ').slice(fieldCount).join(' ')
}

export function parseStatus(statusOutput: string): RepositoryStatus {
    const status: RepositoryStatus = {
        branchName: null,
        hasCommits: true,
        upstream: null,
        remotes: [],
        unstaged: [],
        staged: []
    }

    function addChange(codes: string, change: Omit<FileChange, 'status'>): void {
        const [stagedCode, unstagedCode] = codes
        if (stagedCode !== '.') status.staged.push({ ...change, status: stagedCode as FileStatus })
        if (unstagedCode !== '.') status.unstaged.push({ ...change, status: unstagedCode as FileStatus })
    }

    const entries = statusOutput.split('\0')
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const codes = entry.slice(2, 4)

        if (entry.startsWith('# branch.oid ')) {
            status.hasCommits = entry !== '# branch.oid (initial)'
        } else if (entry.startsWith('# branch.head ')) {
            const branchName = entry.slice('# branch.head '.length)
            status.branchName = branchName === '(detached)' ? null : branchName
        } else if (entry.startsWith('# branch.upstream ')) {
            status.upstream = entry.slice('# branch.upstream '.length)
        } else if (entry.startsWith('1 ')) {
            addChange(codes, { path: pathAfterFields(entry, FIELDS_BEFORE_PATH.ordinary) })
        } else if (entry.startsWith('2 ')) {
            i++
            addChange(codes, {
                path: pathAfterFields(entry, FIELDS_BEFORE_PATH.renamed),
                originalPath: entries[i]
            })
        } else if (entry.startsWith('u ')) {
            status.unstaged.push({
                path: pathAfterFields(entry, FIELDS_BEFORE_PATH.unmerged),
                status: 'U'
            })
        } else if (entry.startsWith('? ')) {
            status.unstaged.push({ path: entry.slice(2), status: '?' })
        }
    }

    return status
}

export async function readRepositoryStatus(repository: {
    gitPath: string
    repositoryPath: string
}): Promise<RepositoryStatus> {
    const result = await runGit({
        ...repository,
        gitArguments: [
            '--no-optional-locks',
            'status',
            '--porcelain=v2',
            '--branch',
            '--untracked-files=all',
            '-z'
        ]
    })
    if (result.exitCode !== 0) throw new Error(result.stderr.toString().trim())

    const remotesResult = await runGit({ ...repository, gitArguments: ['remote'] })
    if (remotesResult.exitCode !== 0) throw new Error(remotesResult.stderr.toString().trim())

    return {
        ...parseStatus(result.stdout.toString()),
        remotes: remotesResult.stdout
            .toString()
            .split('\n')
            .filter((remote) => remote !== '')
    }
}
