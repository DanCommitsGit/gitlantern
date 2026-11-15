import { memo } from 'react'
import type { DiffHunk, DiffLine } from '../../../shared/repository-types'
import { alignDiff, type AlignedHunk, type WordSegment } from '../diff-alignment'
import {
  splitRows,
  unifiedLines,
  withEndOfFileLine,
  wordLines,
  type MarkedLine,
  type WordLine
} from '../diff-rows'
import type { DiffViewMode } from '../diff-view-mode'

const LINE_CLASSES: Record<DiffLine['kind'], string> = {
  context: '',
  added: 'diff-line-added',
  removed: 'diff-line-removed',
  'no-newline': 'diff-line-note'
}

const LINE_MARKERS: Record<DiffLine['kind'], string> = {
  context: '',
  added: '+',
  removed: '-',
  'no-newline': ''
}

const WORD_CLASSES: Record<WordLine['segments'][number]['kind'], string> = {
  common: '',
  added: 'diff-word-added',
  removed: 'diff-word-removed'
}

// Marks the words that differ from the line's partner on the other side.
function LineText({ marked }: { marked: MarkedLine }): React.JSX.Element {
  if (marked.segments === undefined) return <span>{marked.line.text}</span>
  return (
    <span>
      {marked.segments.map((segment: WordSegment, index) => (
        <span key={index} className={segment.kind === 'common' ? '' : 'diff-word-mark'}>
          {segment.text}
        </span>
      ))}
    </span>
  )
}

function UnifiedLine({ marked }: { marked: MarkedLine }): React.JSX.Element {
  const { line, kind } = marked
  return (
    <div className={`diff-line ${LINE_CLASSES[kind]}`}>
      <span className="diff-line-number">{line.oldLineNumber}</span>
      <span className="diff-line-number">{line.newLineNumber}</span>
      <span>{LINE_MARKERS[kind]}</span>
      <LineText marked={marked} />
    </div>
  )
}

function SplitCell({
  marked,
  side
}: {
  marked: MarkedLine | null
  side: 'old' | 'new'
}): React.JSX.Element {
  if (marked === null) return <div className="diff-split-cell diff-split-empty" />
  const { line, kind } = marked
  return (
    <div className={`diff-split-cell ${LINE_CLASSES[kind]}`}>
      <span className="diff-line-number">
        {side === 'old' ? line.oldLineNumber : line.newLineNumber}
      </span>
      <span>{LINE_MARKERS[kind]}</span>
      <LineText marked={marked} />
    </div>
  )
}

function WordsLine({ line }: { line: WordLine }): React.JSX.Element {
  return (
    <div className={`diff-line ${line.isNote ? 'diff-line-note' : ''}`}>
      <span className="diff-line-number">{line.oldLineNumber}</span>
      <span className="diff-line-number">{line.newLineNumber}</span>
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
        <div className="diff-split">
          {splitRows(hunk).map((row, index) => (
            <div key={index} className="diff-split-row">
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
    <div className="diff-scroll">
      <div className="diff-body">
        {shownHunks.map((hunk, index) => (
          <div key={hunk.header}>
            <div className="diff-hunk-head">{hunk.header}</div>
            <HunkLines hunk={alignedHunks[index]} mode={mode} />
          </div>
        ))}
      </div>
    </div>
  )
})
