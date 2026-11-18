import { useRef, useState } from 'react'
import type { FileDiff } from '../../../shared/repository-types'
import {
  loadDiffViewMode,
  saveDiffViewMode,
  SPLIT_MIN_WIDTH,
  type DiffViewMode
} from '../diff-view-mode'
import { useElementWidth } from '../use-element-width'
import { DiffHunks } from './DiffHunks'
import { DiffMessage } from './DiffMessage'
import { DiffViewButtons } from './DiffViewButtons'

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
  mode,
  onShowLarge
}: {
  diff: FileDiff
  mode: DiffViewMode
  onShowLarge(): void
}): React.JSX.Element {
  switch (diff.kind) {
    case 'text':
      return <DiffHunks hunks={diff.hunks} reachesEndOfFile={diff.reachesEndOfFile} mode={mode} />
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
          <button className="button self-start" type="button" onClick={onShowLarge}>
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
  // null when nothing is selected, which shows the children instead.
  title: string | null
  diff: FileDiff | null
  onShowLarge(): void
  children?: React.ReactNode
}

export function DiffView({ title, diff, onShowLarge, children }: DiffViewProps): React.JSX.Element {
  const paneRef = useRef<HTMLElement>(null)
  const paneWidth = useElementWidth(paneRef)
  const [chosenMode, setChosenMode] = useState(loadDiffViewMode)
  const splitFits = paneWidth >= SPLIT_MIN_WIDTH
  const shownMode = chosenMode === 'split' && !splitFits ? 'unified' : chosenMode

  function chooseMode(mode: DiffViewMode): void {
    setChosenMode(mode)
    saveDiffViewMode(mode)
  }

  return (
    <section className="pane min-w-0 flex-1" ref={paneRef}>
      {title === null ? (
        children
      ) : (
        <>
          <div className="pane-head">
            <span className="min-w-0 flex-1 truncate font-mono text-code">{title}</span>
            {diff?.kind === 'text' && (
              <DiffViewButtons shownMode={shownMode} splitFits={splitFits} onChoose={chooseMode} />
            )}
          </div>
          {diff && <DiffContent diff={diff} mode={shownMode} onShowLarge={onShowLarge} />}
        </>
      )}
    </section>
  )
}
