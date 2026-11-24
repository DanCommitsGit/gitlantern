import { DefaultLinesDiffComputer } from 'vscode-diff/dist/vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer'
import type { DiffHunk, DiffLine } from '../../shared/repository-types'

export interface WordSegment {
    kind: 'common' | 'added' | 'removed'
    text: string
}

/** A row of the side-by-side view. A missing side is drawn as an empty cell. */
export interface AlignedRow {
    oldLine: DiffLine | null
    newLine: DiffLine | null
    isChanged: boolean
}

/** A hunk lined up once, which all three views draw from. */
export interface AlignedHunk {
    lines: DiffLine[]
    rows: AlignedRow[]
    oldMarks: Map<DiffLine, WordSegment[]>
    newMarks: Map<DiffLine, WordSegment[]>
    /** The changed words of each row whose two lines differ only inside themselves. */
    rowWords: Map<AlignedRow, WordSegment[]>
}

interface LineRange {
    readonly startLineNumber: number
    readonly endLineNumberExclusive: number
}

interface TextRange {
    readonly startLineNumber: number
    readonly startColumn: number
    readonly endLineNumber: number
    readonly endColumn: number
}

interface InnerChange {
    readonly originalRange: TextRange
    readonly modifiedRange: TextRange
}

interface LineMapping {
    readonly original: LineRange
    readonly modified: LineRange
    readonly innerChanges?: readonly InnerChange[]
}

/** Changed columns of one line, as zero-based [start, end) offsets. */
type ChangedSpans = Map<number, [number, number][]>

// Line matching for a whole diff stops after this, and the hunks left over are lined up the way git lists them.
const ALIGNMENT_BUDGET_MS = 5000
const CACHED_DIFF_COUNT = 20

const diffComputer = new DefaultLinesDiffComputer()
const isNote = (line: DiffLine): boolean => line.kind === 'no-newline'

// The lines of one side of the hunk, in order. VS Code's line numbers count from 1 into these.
function sideLines(hunk: DiffHunk, side: 'old' | 'new'): DiffLine[] {
    return hunk.lines.filter(
        (line) =>
            !isNote(line) && (side === 'old' ? line.oldLineNumber !== null : line.newLineNumber !== null)
    )
}

// Git's own runs of removed and added lines, for when VS Code's matching can't be used.
function gitMappings(hunk: DiffHunk): LineMapping[] {
    const mappings: { original: LineRange; modified: LineRange }[] = []
    let open: { original: LineRange; modified: LineRange } | null = null
    let oldNumber = 1
    let newNumber = 1
    for (const line of hunk.lines) {
        if (isNote(line)) continue
        const onOld = line.oldLineNumber !== null
        const onNew = line.newLineNumber !== null
        if (onOld && onNew) {
            open = null
        } else {
            if (
                open === null ||
                (onOld && open.modified.endLineNumberExclusive > open.modified.startLineNumber)
            ) {
                open = {
                    original: { startLineNumber: oldNumber, endLineNumberExclusive: oldNumber },
                    modified: { startLineNumber: newNumber, endLineNumberExclusive: newNumber }
                }
                mappings.push(open)
            }
            if (onOld) open.original = { ...open.original, endLineNumberExclusive: oldNumber + 1 }
            if (onNew) open.modified = { ...open.modified, endLineNumberExclusive: newNumber + 1 }
        }
        if (onOld) oldNumber++
        if (onNew) newNumber++
    }
    return mappings
}

function vscodeMappings(
    oldLines: DiffLine[],
    newLines: DiffLine[],
    deadline: number
): readonly LineMapping[] | null {
    const timeLeft = deadline - performance.now()
    if (timeLeft <= 0 || oldLines.length === 0 || newLines.length === 0) return null
    try {
        const result = diffComputer.computeDiff(
            oldLines.map((line) => line.text),
            newLines.map((line) => line.text),
            {
                ignoreTrimWhitespace: false,
                computeMoves: false,
                maxComputationTimeMs: Math.ceil(timeLeft)
            }
        )
        return result.hitTimeout ? null : result.changes
    } catch {
        // Git's own lines still show the change if VS Code's matching throws.
        return null
    }
}

// Lines each changed range up the way VS Code's side-by-side view does: both sides meet again wherever
// a changed range starts or ends partway through a line, and the shorter side is padded at the bottom.
function alignRows(
    oldLines: DiffLine[],
    newLines: DiffLine[],
    mappings: readonly LineMapping[]
): AlignedRow[] {
    const rows: AlignedRow[] = []
    const addRows = (
        oldStart: number,
        oldEnd: number,
        newStart: number,
        newEnd: number,
        isChanged: boolean
    ): void => {
        const rowCount = Math.max(oldEnd - oldStart, newEnd - newStart)
        for (let offset = 0; offset < rowCount; offset++) {
            rows.push({
                oldLine: oldStart + offset < oldEnd ? oldLines[oldStart + offset - 1] : null,
                newLine: newStart + offset < newEnd ? newLines[newStart + offset - 1] : null,
                isChanged
            })
        }
    }

    let nextOld = 1
    let nextNew = 1
    for (const mapping of mappings) {
        const { original, modified } = mapping
        addRows(nextOld, original.startLineNumber, nextNew, modified.startLineNumber, false)
        let isFirst = true
        let lastOld = original.startLineNumber
        let lastNew = modified.startLineNumber
        const meet = (oldEnd: number, newEnd: number, isForced = false): void => {
            if (oldEnd < lastOld || newEnd < lastNew) return
            if (isFirst) isFirst = false
            else if (!isForced && (oldEnd === lastOld || newEnd === lastNew)) return
            if (oldEnd === lastOld && newEnd === lastNew) return
            addRows(lastOld, oldEnd, lastNew, newEnd, true)
            lastOld = oldEnd
            lastNew = newEnd
        }
        for (const inner of mapping.innerChanges ?? []) {
            const from = inner.originalRange
            const to = inner.modifiedRange
            if (from.startColumn > 1 && to.startColumn > 1) meet(from.startLineNumber, to.startLineNumber)
            const endLine = oldLines[from.endLineNumber - 1]
            const lineEndColumn = endLine ? endLine.text.length + 1 : Number.MAX_SAFE_INTEGER
            if (from.endColumn < lineEndColumn) meet(from.endLineNumber, to.endLineNumber)
        }
        meet(original.endLineNumberExclusive, modified.endLineNumberExclusive, true)
        nextOld = original.endLineNumberExclusive
        nextNew = modified.endLineNumberExclusive
    }
    addRows(nextOld, oldLines.length + 1, nextNew, newLines.length + 1, false)
    return rows
}

// The columns of one line that a changed range, which may cross lines, covers. Null when it covers none.
function spanOn(range: TextRange, lineNumber: number, lines: DiffLine[]): [number, number] | null {
    const line = lines[lineNumber - 1]
    if (!line || lineNumber < range.startLineNumber || lineNumber > range.endLineNumber) return null
    const start = lineNumber === range.startLineNumber ? range.startColumn - 1 : 0
    const end = lineNumber === range.endLineNumber ? range.endColumn - 1 : line.text.length
    return end > start ? [start, end] : null
}

function addSpans(spans: ChangedSpans, range: TextRange, lines: DiffLine[]): void {
    for (let lineNumber = range.startLineNumber; lineNumber <= range.endLineNumber; lineNumber++) {
        const span = spanOn(range, lineNumber, lines)
        if (span === null) continue
        spans.set(lineNumber, [...(spans.get(lineNumber) ?? []), span])
    }
}

function segmentsOf(text: string, spans: [number, number][], kind: 'added' | 'removed'): WordSegment[] {
    const segments: WordSegment[] = []
    let position = 0
    for (const [start, end] of [...spans].sort((first, second) => first[0] - second[0])) {
        if (end <= position) continue
        const from = Math.max(start, position)
        if (from > position) segments.push({ kind: 'common', text: text.slice(position, from) })
        segments.push({ kind, text: text.slice(from, end) })
        position = end
    }
    if (position < text.length) segments.push({ kind: 'common', text: text.slice(position) })
    return segments
}

// VS Code marks changed text only inside a change that both removes and adds lines.
function markedChanges(mappings: readonly LineMapping[]): InnerChange[] {
    return mappings.flatMap((mapping) => {
        const { original, modified } = mapping
        const isOneSided =
            original.startLineNumber === original.endLineNumberExclusive ||
            modified.startLineNumber === modified.endLineNumberExclusive
        if (isOneSided) return []
        return (mapping.innerChanges ?? []).filter(
            (inner) =>
                inner.originalRange.startLineNumber < original.endLineNumberExclusive &&
                inner.modifiedRange.startLineNumber < modified.endLineNumberExclusive
        )
    })
}

const isWithinLine = (range: TextRange): boolean => range.startLineNumber === range.endLineNumber

// A row's two lines can share one line in the Words view when every change touching them stays inside them.
function rowWordsOf(
    rows: AlignedRow[],
    changes: InnerChange[],
    oldLines: DiffLine[],
    newLines: DiffLine[]
): Map<AlignedRow, WordSegment[]> {
    const result = new Map<AlignedRow, WordSegment[]>()
    const oldNumbers = new Map(oldLines.map((line, index) => [line, index + 1]))
    const newNumbers = new Map(newLines.map((line, index) => [line, index + 1]))
    for (const row of rows) {
        if (!row.isChanged || row.oldLine === null || row.newLine === null) continue
        const oldNumber = oldNumbers.get(row.oldLine) ?? 0
        const newNumber = newNumbers.get(row.newLine) ?? 0
        const touching = changes.filter(
            (inner) =>
                spanOn(inner.originalRange, oldNumber, oldLines) !== null ||
                spanOn(inner.modifiedRange, newNumber, newLines) !== null
        )
        const staysInRow = touching.every(
            (inner) =>
                isWithinLine(inner.originalRange) &&
                isWithinLine(inner.modifiedRange) &&
                inner.originalRange.startLineNumber === oldNumber &&
                inner.modifiedRange.startLineNumber === newNumber
        )
        if (touching.length === 0 || !staysInRow) continue

        const oldText = row.oldLine.text
        const newText = row.newLine.text
        const segments: WordSegment[] = []
        const push = (kind: WordSegment['kind'], text: string): void => {
            if (text !== '') segments.push({ kind, text })
        }
        let oldPosition = 0
        for (const inner of touching) {
            const oldStart = inner.originalRange.startColumn - 1
            push('common', oldText.slice(oldPosition, oldStart))
            push('removed', oldText.slice(oldStart, inner.originalRange.endColumn - 1))
            push(
                'added',
                newText.slice(inner.modifiedRange.startColumn - 1, inner.modifiedRange.endColumn - 1)
            )
            oldPosition = inner.originalRange.endColumn - 1
        }
        push('common', oldText.slice(oldPosition))
        const sharesText = segments.some((segment) => segment.kind === 'common' && segment.text.trim() !== '')
        if (sharesText) result.set(row, segments)
    }
    return result
}

// Puts each missing-newline note right after the line it belongs to, on that line's side.
function withNotes(hunk: DiffHunk, rows: AlignedRow[]): AlignedRow[] {
    const notesAfter = new Map<number, AlignedRow[]>()
    let previous: DiffLine | null = null
    for (const line of hunk.lines) {
        if (!isNote(line)) {
            previous = line
            continue
        }
        const onOld = previous !== null && previous.kind !== 'added'
        const onNew = previous !== null && previous.kind !== 'removed'
        const oldRow = onOld ? rows.findIndex((row) => row.oldLine === previous) : -1
        const newRow = onNew ? rows.findIndex((row) => row.newLine === previous) : -1
        const noteRows =
            oldRow === newRow
                ? [{ at: oldRow, row: { oldLine: line, newLine: line, isChanged: false } }]
                : [
                      { at: oldRow, row: { oldLine: line, newLine: null, isChanged: false } },
                      { at: newRow, row: { oldLine: null, newLine: line, isChanged: false } }
                  ].filter((note) => (note.row.oldLine ? onOld : onNew))
        for (const { at, row } of noteRows) {
            const key = at === -1 ? rows.length - 1 : at
            notesAfter.set(key, [...(notesAfter.get(key) ?? []), row])
        }
    }
    return rows.flatMap((row, index) => [row, ...(notesAfter.get(index) ?? [])])
}

function alignHunk(hunk: DiffHunk, deadline: number): AlignedHunk {
    const oldLines = sideLines(hunk, 'old')
    const newLines = sideLines(hunk, 'new')
    const mappings = vscodeMappings(oldLines, newLines, deadline)
    const rows = alignRows(oldLines, newLines, mappings ?? gitMappings(hunk))
    const changes = markedChanges(mappings ?? [])

    const oldSpans: ChangedSpans = new Map()
    const newSpans: ChangedSpans = new Map()
    for (const inner of changes) {
        addSpans(oldSpans, inner.originalRange, oldLines)
        addSpans(newSpans, inner.modifiedRange, newLines)
    }
    const marksOf = (
        spans: ChangedSpans,
        lines: DiffLine[],
        kind: 'added' | 'removed'
    ): Map<DiffLine, WordSegment[]> =>
        new Map(
            [...spans].map(([lineNumber, lineSpans]) => {
                const line = lines[lineNumber - 1]
                return [line, segmentsOf(line.text, lineSpans, kind)]
            })
        )

    return {
        lines: hunk.lines,
        rows: withNotes(hunk, rows),
        oldMarks: marksOf(oldSpans, oldLines, 'removed'),
        newMarks: marksOf(newSpans, newLines, 'added'),
        rowWords: rowWordsOf(rows, changes, oldLines, newLines)
    }
}

// Keyed by content, because the same diff arrives as new objects every time the window gets focus.
const alignedDiffs = new Map<string, AlignedHunk[]>()

export function alignDiff(hunks: DiffHunk[]): AlignedHunk[] {
    const key = hunks
        .map((hunk) =>
            [
                hunk.header,
                ...hunk.lines.map(
                    (line) => `${line.kind} ${line.oldLineNumber} ${line.newLineNumber} ${line.text}`
                )
            ].join('\n')
        )
        .join('\n\n')
    const cached = alignedDiffs.get(key)
    if (cached) return cached

    const deadline = performance.now() + ALIGNMENT_BUDGET_MS
    const aligned = hunks.map((hunk) => alignHunk(hunk, deadline))
    alignedDiffs.set(key, aligned)
    if (alignedDiffs.size > CACHED_DIFF_COUNT) {
        alignedDiffs.delete(alignedDiffs.keys().next().value as string)
    }
    return aligned
}
