import type { DiffHunk, DiffLine, FileDiff } from '../../../shared/repository-types'
import type { SelectedChange } from '../selected-change'

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

function DiffLineRow({ line }: { line: DiffLine }): React.JSX.Element {
  return (
    <div className={`diff-line ${LINE_CLASSES[line.kind]}`}>
      <span className="diff-line-number">{line.oldLineNumber}</span>
      <span className="diff-line-number">{line.newLineNumber}</span>
      <span>{LINE_MARKERS[line.kind]}</span>
      <span>{line.text}</span>
    </div>
  )
}

function HunkView({ hunk }: { hunk: DiffHunk }): React.JSX.Element {
  return (
    <>
      <div className="diff-hunk-head">{hunk.header}</div>
      {hunk.lines.map((line, lineIndex) => (
        <DiffLineRow key={lineIndex} line={line} />
      ))}
    </>
  )
}

function DiffContent({ diff }: { diff: FileDiff }): React.JSX.Element | null {
  if (diff.kind !== 'text') return null

  return (
    <div className="diff-scroll">
      <div className="diff-body">
        {diff.hunks.map((hunk) => (
          <HunkView key={hunk.header} hunk={hunk} />
        ))}
      </div>
    </div>
  )
}

interface DiffViewProps {
  selected: SelectedChange | null
  diff: FileDiff | null
}

export function DiffView({ selected, diff }: DiffViewProps): React.JSX.Element {
  if (selected === null) return <section className="pane grow" />

  return (
    <section className="pane grow">
      <div className="pane-head">
        <span className="mono grow truncate">
          {selected.change.originalPath
            ? `${selected.change.originalPath} → ${selected.change.path}`
            : selected.change.path}
          {selected.staged ? ', staged' : ', unstaged'}
        </span>
      </div>
      {diff && <DiffContent diff={diff} />}
    </section>
  )
}
