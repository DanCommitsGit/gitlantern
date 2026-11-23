import { lstat, readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import parseDiff from 'parse-diff'
import type { DiffHunk, DiffLine, FileChange, FileDiff } from '../../shared/repository-types'
import { COMMIT_SHOW_OPTIONS } from './commit-files'
import { runGit } from './run-git'

const LARGE_DIFF_LINE_COUNT = 5000
const NO_NEWLINE_MARKER = '\\'
const COMMON_DIFF_OPTIONS = ['--no-ext-diff', '--no-color']

function diffArguments(change: FileChange, staged: boolean): string[] {
  if (change.status === '?') {
    return [
      '--no-optional-locks',
      'diff',
      ...COMMON_DIFF_OPTIONS,
      '--no-index',
      '--',
      '/dev/null',
      change.path
    ]
  }

  return [
    '--literal-pathspecs',
    '--no-optional-locks',
    'diff',
    ...COMMON_DIFF_OPTIONS,
    ...(staged ? ['--cached'] : []),
    '--',
    change.path,
    ...(change.originalPath === undefined ? [] : [change.originalPath])
  ]
}

function toDiffLine(change: parseDiff.Change): DiffLine {
  if (change.content.startsWith(NO_NEWLINE_MARKER)) {
    return {
      kind: 'no-newline',
      oldLineNumber: null,
      newLineNumber: null,
      text: change.content.slice(2)
    }
  }

  const text = change.content.slice(1).replace(/\r$/, '')
  if (change.type === 'add') {
    return { kind: 'added', oldLineNumber: null, newLineNumber: change.ln, text }
  }
  if (change.type === 'del') {
    return { kind: 'removed', oldLineNumber: change.ln, newLineNumber: null, text }
  }
  return { kind: 'context', oldLineNumber: change.ln1, newLineNumber: change.ln2, text }
}

function toHunk(chunk: parseDiff.Chunk): DiffHunk {
  return { header: chunk.content, lines: chunk.changes.map(toDiffLine) }
}

// Header lines that describe the change, without the ones naming the file and its object ids.
function changeDetails(diffText: string): string {
  return diffText
    .split('\n')
    .filter((line) => line !== '' && !/^(diff |index |--- |\+\+\+ )/.test(line))
    .join('\n')
}

function countLines(output: Buffer): number {
  let lineCount = 0
  for (const byte of output) {
    if (byte === 0x0a) lineCount++
  }
  return lineCount
}

type Repository = { gitPath: string; repositoryPath: string }

async function readBlob(repository: Repository, objectName: string): Promise<Buffer | null> {
  const result = await runGit({
    ...repository,
    gitArguments: ['--no-optional-locks', 'cat-file', 'blob', objectName]
  })
  return result.exitCode === 0 ? result.stdout : null
}

async function readWorkingFile(repository: Repository, path: string): Promise<Buffer | null> {
  const repositoryRoot = resolve(repository.repositoryPath)
  const filePath = resolve(repositoryRoot, path)
  if (!filePath.startsWith(repositoryRoot + sep)) return null
  try {
    // Git diffs a symbolic link's target path, not the file it points to.
    if ((await lstat(filePath)).isSymbolicLink()) return null
    return await readFile(filePath)
  } catch {
    return null
  }
}

// Counts a last line that has no line break.
function fileLineCount(contents: Buffer): number {
  const endsWithoutLineBreak = contents.length > 0 && contents[contents.length - 1] !== 0x0a
  return countLines(contents) + (endsWithoutLineBreak ? 1 : 0)
}

const DELETED_FILE = Buffer.alloc(0)

function lastNewLineNumber(hunks: DiffHunk[]): number {
  const lastHunk = hunks.at(-1)
  return Math.max(0, ...(lastHunk?.lines.map((line) => line.newLineNumber ?? 0) ?? []))
}

async function toFileDiff(
  diffOutput: Buffer,
  showLarge: boolean,
  readNewVersion: () => Promise<Buffer | null>
): Promise<FileDiff> {
  const lineCount = countLines(diffOutput)
  if (!showLarge && lineCount > LARGE_DIFF_LINE_COUNT) return { kind: 'too-large', lineCount }

  const diffText = diffOutput.toString()
  const chunks = parseDiff(diffText).flatMap((file) => file.chunks)
  if (chunks.length > 0) {
    const hunks = chunks.map(toHunk)
    const newVersion = await readNewVersion()
    return {
      kind: 'text',
      hunks,
      reachesEndOfFile:
        newVersion !== null && fileLineCount(newVersion) === lastNewLineNumber(hunks)
    }
  }

  const details = changeDetails(diffText)
  return details.includes('Binary files') || details.includes('GIT binary patch')
    ? { kind: 'binary', details }
    : { kind: 'no-content-change', details }
}

export async function readFileDiff(
  repository: Repository,
  change: FileChange,
  staged: boolean,
  showLarge: boolean
): Promise<FileDiff> {
  // Git prints a combined diff for a conflicted file, which has its own view.
  if (change.status === 'U') return { kind: 'conflict' }

  const result = await runGit({ ...repository, gitArguments: diffArguments(change, staged) })

  // --no-index exits 1 when the files differ, which is always true here.
  const failed = change.status === '?' ? result.exitCode > 1 : result.exitCode !== 0
  if (failed) throw new Error(result.stderr.toString().trim())

  return toFileDiff(result.stdout, showLarge, async () => {
    if (change.status === 'D') return DELETED_FILE
    return staged
      ? readBlob(repository, `:0:${change.path}`)
      : readWorkingFile(repository, change.path)
  })
}

export async function readCommitFileDiff(
  repository: Repository,
  commitHash: string,
  change: FileChange,
  showLarge: boolean
): Promise<FileDiff> {
  const result = await runGit({
    ...repository,
    gitArguments: [
      '--literal-pathspecs',
      '--no-optional-locks',
      'show',
      '--format=',
      ...COMMON_DIFF_OPTIONS,
      ...COMMIT_SHOW_OPTIONS,
      commitHash,
      '--',
      change.path,
      ...(change.originalPath === undefined ? [] : [change.originalPath])
    ]
  })
  if (result.exitCode !== 0) throw new Error(result.stderr.toString().trim())

  return toFileDiff(result.stdout, showLarge, async () =>
    change.status === 'D' ? DELETED_FILE : readBlob(repository, `${commitHash}:${change.path}`)
  )
}
