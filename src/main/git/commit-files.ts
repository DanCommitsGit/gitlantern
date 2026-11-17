import type { FileChange, FileStatus } from '../../shared/repository-types'
import { runGit } from './run-git'

// A merge commit is compared with its first parent, which is the branch it was merged into.
export const COMMIT_DIFF_OPTIONS = ['--diff-merges=first-parent', '--find-renames']

export function parseNameStatus(nameStatusOutput: string): FileChange[] {
  const fields = nameStatusOutput.split('\0')
  const changes: FileChange[] = []
  for (let i = 0; i + 1 < fields.length; i++) {
    const status = fields[i].trim().charAt(0) as FileStatus
    if (status === 'R' || status === 'C') {
      changes.push({ status, originalPath: fields[i + 1], path: fields[i + 2] })
      i += 2
    } else {
      changes.push({ status, path: fields[i + 1] })
      i += 1
    }
  }
  return changes
}

export async function readCommitFiles(
  repository: { gitPath: string; repositoryPath: string },
  commitHash: string
): Promise<FileChange[]> {
  const result = await runGit({
    ...repository,
    gitArguments: [
      '--no-optional-locks',
      'show',
      '--format=',
      '--name-status',
      '-z',
      ...COMMIT_DIFF_OPTIONS,
      commitHash
    ]
  })
  if (result.exitCode !== 0) throw new Error(result.stderr.toString().trim())

  return parseNameStatus(result.stdout.toString())
}
