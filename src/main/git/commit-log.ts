import { formatCommand } from '../../shared/git-actions'
import type { Commit, CommitLogPage, CommitRef, LogScope } from '../../shared/history-types'
import { runGit } from './run-git'

export const COMMIT_PAGE_SIZE = 200

const LOG_FIELDS = ['%H', '%P', '%D', '%an', '%ae', '%aI', '%s', '%b']

const SCOPE_ARGUMENTS: Record<LogScope, string[]> = {
  'all-branches': ['--all'],
  'this-branch': [],
  'first-parent': ['--first-parent']
}

// Reads the names `--decorate=full` prints, such as "HEAD -> refs/heads/main, tag: refs/tags/v1".
export function parseRefs(decoration: string): CommitRef[] {
  const refs: CommitRef[] = []
  for (const name of decoration.split(', ')) {
    if (name === 'HEAD') {
      refs.push({ kind: 'head', name: 'HEAD' })
    } else if (name.startsWith('HEAD -> refs/heads/')) {
      refs.push({ kind: 'head', name: name.slice('HEAD -> refs/heads/'.length) })
    } else if (name.startsWith('refs/heads/')) {
      refs.push({ kind: 'branch', name: name.slice('refs/heads/'.length) })
    } else if (name.startsWith('tag: refs/tags/')) {
      refs.push({ kind: 'tag', name: name.slice('tag: refs/tags/'.length) })
    } else if (name.startsWith('refs/remotes/') && !name.endsWith('/HEAD')) {
      refs.push({ kind: 'remote', name: name.slice('refs/remotes/'.length) })
    }
  }
  return refs
}

export function parseLog(logOutput: string): Commit[] {
  const fields = logOutput.split('\0')
  const commits: Commit[] = []
  for (let start = 0; start + LOG_FIELDS.length <= fields.length; start += LOG_FIELDS.length) {
    const [hash, parents, decoration, authorName, authorEmail, authorDate, subject, body] =
      fields.slice(start, start + LOG_FIELDS.length)
    commits.push({
      hash,
      parentHashes: parents === '' ? [] : parents.split(' '),
      refs: parseRefs(decoration),
      subject,
      body: body.trim(),
      authorName,
      authorEmail,
      authorDate
    })
  }
  return commits
}

function matchesSearch(commit: Commit, lowerCaseSearch: string): boolean {
  return (
    commit.hash.startsWith(lowerCaseSearch) ||
    [commit.subject, commit.body, commit.authorName, commit.authorEmail].some((text) =>
      text.toLowerCase().includes(lowerCaseSearch)
    )
  )
}

export async function readCommitLog(
  repository: { gitPath: string; repositoryPath: string },
  scope: LogScope,
  search: string,
  skip: number
): Promise<CommitLogPage> {
  const lowerCaseSearch = search.trim().toLowerCase()
  const isSearching = lowerCaseSearch !== ''
  const typedArguments = ['log', ...SCOPE_ARGUMENTS[scope]]
  // shortcut: a search reads the whole log for every page, because git can't match the message,
  // author and hash in one command. Cache or stream the log if large repositories feel slow.
  const pageArguments = isSearching ? [] : [`--skip=${skip}`, `--max-count=${COMMIT_PAGE_SIZE + 1}`]
  const gitArguments = [
    '--no-optional-locks',
    ...typedArguments,
    // Parents never come before their children, which the graph relies on.
    '--topo-order',
    '--decorate=full',
    // log.showSignature would print gpg output into the parsed text.
    '--no-show-signature',
    `--format=${LOG_FIELDS.join('%x00')}`,
    '-z',
    ...pageArguments
  ]

  const result = await runGit({ ...repository, gitArguments })
  if (result.exitCode !== 0) throw new Error(result.stderr.toString().trim())

  const allCommits = parseLog(result.stdout.toString())
  const commits = isSearching
    ? allCommits.filter((commit) => matchesSearch(commit, lowerCaseSearch)).slice(skip)
    : allCommits

  return {
    commits: commits.slice(0, COMMIT_PAGE_SIZE),
    hasMore: commits.length > COMMIT_PAGE_SIZE,
    record:
      isSearching || skip > 0
        ? null
        : {
            typedCommand: formatCommand(typedArguments),
            ranCommand: formatCommand(gitArguments),
            exactCommand: formatCommand(result.fullArguments),
            differsFromTyped: true,
            exitCode: 0,
            output: '',
            finishedAt: Date.now()
          }
  }
}
