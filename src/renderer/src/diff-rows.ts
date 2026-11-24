import type { DiffHunk, DiffLine } from '../../shared/repository-types'
import type { AlignedHunk, AlignedRow, WordSegment } from './diff-alignment'

/** A diff line drawn as `kind`, with its changed words marked when it has any. */
export interface MarkedLine {
    line: DiffLine
    kind: DiffLine['kind']
    segments?: WordSegment[]
}

/** One row of the side-by-side view. A missing side is drawn as an empty cell. */
export interface SplitRow {
    left: MarkedLine | null
    right: MarkedLine | null
}

export interface WordLine {
    oldLineNumber: number | null
    newLineNumber: number | null
    isNote: boolean
    segments: WordSegment[]
}

const isNote = (line: DiffLine): boolean => line.kind === 'no-newline'

// Keeps git's line order; only the word marks come from the alignment.
export function unifiedLines(hunk: AlignedHunk): MarkedLine[] {
    return hunk.lines.map((line) => ({
        line,
        kind: line.kind,
        segments:
            line.kind === 'removed'
                ? hunk.oldMarks.get(line)
                : line.kind === 'added'
                  ? hunk.newMarks.get(line)
                  : undefined
    }))
}

function splitCell(hunk: AlignedHunk, row: AlignedRow, side: 'old' | 'new'): MarkedLine | null {
    const line = side === 'old' ? row.oldLine : row.newLine
    if (line === null) return null
    if (isNote(line)) return { line, kind: line.kind }
    if (!row.isChanged) return { line, kind: 'context' }
    return side === 'old'
        ? { line, kind: 'removed', segments: hunk.oldMarks.get(line) }
        : { line, kind: 'added', segments: hunk.newMarks.get(line) }
}

export function splitRows(hunk: AlignedHunk): SplitRow[] {
    return hunk.rows.map((row) => ({
        left: splitCell(hunk, row, 'old'),
        right: splitCell(hunk, row, 'new')
    }))
}

function wholeLine(
    line: DiffLine,
    kind: WordSegment['kind'],
    numbers: Pick<WordLine, 'oldLineNumber' | 'newLineNumber'>
): WordLine {
    return { ...numbers, isNote: isNote(line), segments: [{ kind, text: line.text }] }
}

// Shows each changed line once with its removed and added words marked, when its two versions
// share text. Other changed lines show whole, removed lines before the added ones.
export function wordLines(hunk: AlignedHunk): WordLine[] {
    const result: WordLine[] = []
    let removed: WordLine[] = []
    let added: WordLine[] = []
    const flush = (): void => {
        result.push(...removed, ...added)
        removed = []
        added = []
    }

    for (const row of hunk.rows) {
        const { oldLine, newLine } = row
        const oldLineNumber = oldLine?.oldLineNumber ?? null
        const newLineNumber = newLine?.newLineNumber ?? null
        const words = hunk.rowWords.get(row)
        if (words) {
            flush()
            result.push({ oldLineNumber, newLineNumber, isNote: false, segments: words })
        } else if (row.isChanged) {
            if (oldLine) removed.push(wholeLine(oldLine, 'removed', { oldLineNumber, newLineNumber: null }))
            if (newLine) added.push(wholeLine(newLine, 'added', { oldLineNumber: null, newLineNumber }))
        } else {
            flush()
            const line = (oldLine ?? newLine) as DiffLine
            result.push(
                wholeLine(line, 'common', {
                    oldLineNumber: isNote(line) ? null : oldLineNumber,
                    newLineNumber: isNote(line) ? null : newLineNumber
                })
            )
        }
    }
    flush()
    return result
}

// The empty line editors show after a file's last line break. A side that ends without one has none.
function endOfFileLine(hunk: DiffHunk): DiffLine | null {
    let lastOldLine: number | null = null
    let lastNewLine: number | null = null
    let oldEndsWithLineBreak = true
    let newEndsWithLineBreak = true
    let lastKind: DiffLine['kind'] = 'context'
    for (const line of hunk.lines) {
        if (isNote(line)) {
            if (lastKind !== 'added') oldEndsWithLineBreak = false
            if (lastKind !== 'removed') newEndsWithLineBreak = false
            continue
        }
        lastKind = line.kind
        lastOldLine = line.oldLineNumber ?? lastOldLine
        lastNewLine = line.newLineNumber ?? lastNewLine
    }
    const oldLineNumber = lastOldLine !== null && oldEndsWithLineBreak ? lastOldLine + 1 : null
    const newLineNumber = lastNewLine !== null && newEndsWithLineBreak ? lastNewLine + 1 : null
    if (oldLineNumber === null && newLineNumber === null) return null
    return { kind: 'context', oldLineNumber, newLineNumber, text: '' }
}

export function withEndOfFileLine(hunks: DiffHunk[]): DiffHunk[] {
    const lastHunk = hunks.at(-1)
    const finalLine = lastHunk && endOfFileLine(lastHunk)
    if (!lastHunk || !finalLine) return hunks
    return [...hunks.slice(0, -1), { ...lastHunk, lines: [...lastHunk.lines, finalLine] }]
}
