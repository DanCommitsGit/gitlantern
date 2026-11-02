import parseDiff from 'parse-diff'
import type { DiffHunk, DiffLine, FileChange, FileDiff } from '../../shared/repository-types'
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

export async function readFileDiff(
  repository: { gitPath: string; repositoryPath: string },
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

  const lineCount = countLines(result.stdout)
  if (!showLarge && lineCount > LARGE_DIFF_LINE_COUNT) return { kind: 'too-large', lineCount }

  const diffText = result.stdout.toString()
  const chunks = parseDiff(diffText).flatMap((file) => file.chunks)
  if (chunks.length > 0) return { kind: 'text', hunks: chunks.map(toHunk) }

  const details = changeDetails(diffText)
  return details.includes('Binary files') || details.includes('GIT binary patch')
    ? { kind: 'binary', details }
    : { kind: 'no-content-change', details }
}
