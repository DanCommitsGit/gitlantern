import { memo } from 'react'
import type { DiffHunk, DiffLine } from '../../../shared/repository-types'
import type { DiffViewMode } from '../../../shared/settings'
import { alignDiff, type AlignedHunk, type WordSegment } from '../diff-alignment'
import {
    splitRows,
    unifiedLines,
    withEndOfFileLine,
    wordLines,
    type MarkedLine,
    type WordLine
} from '../diff-rows'

const LINE_CLASSES: Record<DiffLine['kind'], string> = {
    context: '',
    added: 'bg-add text-add-ink',
    removed: 'bg-del text-del-ink',
    'no-newline': 'text-ink-3'
}

// Changed lines color their numbers like their text.
const LINE_NUMBER_COLORS: Record<DiffLine['kind'], string> = {
    context: 'text-ink-3',
    added: '',
    removed: '',
    'no-newline': 'text-ink-3'
}

const WORD_MARK_CLASSES: Record<DiffLine['kind'], string> = {
    context: '',
    added: 'bg-add-word',
    removed: 'bg-del-word',
    'no-newline': ''
}

const UNIFIED_LINE_CLASS = 'grid grid-cols-[40px_40px_18px_minmax(0,1fr)] whitespace-pre'
const SPLIT_CELL_CLASS = 'grid grid-cols-[40px_18px_minmax(0,1fr)] whitespace-pre'

const LINE_MARKERS: Record<DiffLine['kind'], string> = {
    context: '',
    added: '+',
    removed: '-',
    'no-newline': ''
}

const WORD_CLASSES: Record<WordLine['segments'][number]['kind'], string> = {
    common: '',
    added: 'bg-add-word text-add-ink',
    removed: 'bg-del-word text-del-ink line-through'
}

function LineNumber({ kind, number }: { kind: DiffLine['kind']; number: number | null }): React.JSX.Element {
    return <span className={`pr-2 text-right select-none ${LINE_NUMBER_COLORS[kind]}`}>{number}</span>
}

// Marks the words that differ from the line's partner on the other side.
function LineText({ marked }: { marked: MarkedLine }): React.JSX.Element {
    if (marked.segments === undefined) return <span>{marked.line.text}</span>
    return (
        <span>
            {marked.segments.map((segment: WordSegment, index) => (
                <span key={index} className={segment.kind === 'common' ? '' : WORD_MARK_CLASSES[marked.kind]}>
                    {segment.text}
                </span>
            ))}
        </span>
    )
}

function UnifiedLine({ marked }: { marked: MarkedLine }): React.JSX.Element {
    const { line, kind } = marked
    return (
        <div className={`${UNIFIED_LINE_CLASS} ${LINE_CLASSES[kind]}`}>
            <LineNumber kind={kind} number={line.oldLineNumber} />
            <LineNumber kind={kind} number={line.newLineNumber} />
            <span>{LINE_MARKERS[kind]}</span>
            <LineText marked={marked} />
        </div>
    )
}

function SplitCell({ marked, side }: { marked: MarkedLine | null; side: 'old' | 'new' }): React.JSX.Element {
    const divider = side === 'new' ? 'border-l border-line' : ''
    if (marked === null) return <div className={`${SPLIT_CELL_CLASS} ${divider} min-h-5 bg-sunken`} />
    const { line, kind } = marked
    return (
        <div className={`${SPLIT_CELL_CLASS} ${divider} ${LINE_CLASSES[kind]}`}>
            <LineNumber kind={kind} number={side === 'old' ? line.oldLineNumber : line.newLineNumber} />
            <span>{LINE_MARKERS[kind]}</span>
            <LineText marked={marked} />
        </div>
    )
}

function WordsLine({ line }: { line: WordLine }): React.JSX.Element {
    return (
        <div className={`${UNIFIED_LINE_CLASS} ${line.isNote ? LINE_CLASSES['no-newline'] : ''}`}>
            <LineNumber kind="context" number={line.oldLineNumber} />
            <LineNumber kind="context" number={line.newLineNumber} />
            <span />
            <span>
                {line.segments.map((segment, index) => (
                    <span key={index} className={WORD_CLASSES[segment.kind]}>
                        {segment.text}
                    </span>
                ))}
            </span>
        </div>
    )
}

function HunkLines({ hunk, mode }: { hunk: AlignedHunk; mode: DiffViewMode }): React.JSX.Element {
    switch (mode) {
        case 'unified':
            return (
                <>
                    {unifiedLines(hunk).map((marked, index) => (
                        <UnifiedLine key={index} marked={marked} />
                    ))}
                </>
            )
        case 'split':
            return (
                <div>
                    {splitRows(hunk).map((row, index) => (
                        <div key={index} className="grid grid-cols-2">
                            <SplitCell marked={row.left} side="old" />
                            <SplitCell marked={row.right} side="new" />
                        </div>
                    ))}
                </div>
            )
        case 'words':
            return (
                <>
                    {wordLines(hunk).map((line, index) => (
                        <WordsLine key={index} line={line} />
                    ))}
                </>
            )
    }
}

// Memoized so a hover redraw skips building every line again.
export const DiffHunks = memo(function DiffHunks({
    hunks,
    reachesEndOfFile,
    mode
}: {
    hunks: DiffHunk[]
    reachesEndOfFile: boolean
    mode: DiffViewMode
}): React.JSX.Element {
    const shownHunks = reachesEndOfFile ? withEndOfFileLine(hunks) : hunks
    const alignedHunks = alignDiff(shownHunks)
    return (
        <div className="min-h-0 flex-1 overflow-auto">
            <div className="w-fit min-w-full font-mono text-code leading-5">
                {shownHunks.map((hunk, index) => (
                    <div key={hunk.header}>
                        <div className="flex min-h-7.5 items-center border-y border-line bg-sunken px-3 py-0.5 font-mono text-small leading-[1.4] whitespace-pre text-ink-3">
                            {hunk.header}
                        </div>
                        <HunkLines hunk={alignedHunks[index]} mode={mode} />
                    </div>
                ))}
            </div>
        </div>
    )
})
