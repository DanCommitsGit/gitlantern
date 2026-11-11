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

function DiffMessage({
  title,
  message,
  details,
  children
}: {
  title: string
  message: string
  details?: string
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="message-pane">
      <section className="panel message-card">
        <h2 className="text-head">{title}</h2>
        <p className="text-small">{message}</p>
        {details && <div className="output">{details}</div>}
        {children}
      </section>
    </div>
  )
}

function noContentChangeMessage(details: string): React.JSX.Element {
  const similarity = /similarity index (\d+)%/.exec(details)
  if (similarity) {
    return (
      <DiffMessage
        title={`Renamed, ${similarity[1]}% the same`}
        message="The file's contents didn't change."
        details={details}
      />
    )
  }
  if (details.includes('new mode')) {
    return (
      <DiffMessage
        title="File mode changed"
        message="Its contents are the same."
        details={details}
      />
    )
  }
  return <DiffMessage title="Empty file" message="This file has no contents." />
}

function DiffContent({
  diff,
  onShowLarge
}: {
  diff: FileDiff
  onShowLarge(): void
}): React.JSX.Element {
  switch (diff.kind) {
    case 'text':
      return (
        <div className="diff-scroll">
          <div className="diff-body">
            {diff.hunks.map((hunk) => (
              <HunkView key={hunk.header} hunk={hunk} />
            ))}
          </div>
        </div>
      )
    case 'binary':
      return (
        <DiffMessage
          title="Binary file changed"
          message="Git can't show what changed in this file."
          details={diff.details}
        />
      )
    case 'no-content-change':
      return noContentChangeMessage(diff.details)
    case 'too-large':
      return (
        <DiffMessage
          title={`Large diff: ${diff.lineCount.toLocaleString()} lines`}
          message="Not shown until you ask, to keep the app responsive."
        >
          <button
            className="button"
            type="button"
            style={{ alignSelf: 'flex-start' }}
            onClick={onShowLarge}
          >
            Show anyway
          </button>
        </DiffMessage>
      )
    case 'conflict':
      return (
        <DiffMessage
          title="This file has a conflict"
          message="Fix it in your editor, then stage the file."
        />
      )
  }
}

interface DiffViewProps {
  hasCommits: boolean
  selected: SelectedChange | null
  diff: FileDiff | null
  onShowLarge(): void
}

export function DiffView({
  hasCommits,
  selected,
  diff,
  onShowLarge
}: DiffViewProps): React.JSX.Element {
  if (selected === null) {
    return (
      <section className="pane grow">
        {hasCommits ? (
          <DiffMessage
            title="Nothing to commit"
            message="Your files match the last commit. Edit something and it will show up here."
          >
            <div>
              <span className="pill pill-ok">Working tree clean</span>
            </div>
          </DiffMessage>
        ) : (
          <DiffMessage
            title="No commits yet"
            message="This repository is empty. Add a file, stage it and make your first commit."
          />
        )}
      </section>
    )
  }

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
      {diff && <DiffContent diff={diff} onShowLarge={onShowLarge} />}
    </section>
  )
}
