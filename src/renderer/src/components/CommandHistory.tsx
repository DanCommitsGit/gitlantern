import { Check, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import type { CommandRecord } from '../../../shared/command-record'

function StatusMark({ exitCode }: { exitCode: number }): React.JSX.Element {
  return exitCode === 0 ? (
    <Check className="icon text-ok" role="img" aria-label="Succeeded" />
  ) : (
    <>
      <TriangleAlert className="icon text-attention" />
      <span className="text-small text-attention">Failed</span>
    </>
  )
}

function HistoryEntry({ record }: { record: CommandRecord }): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const time = new Date(record.finishedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <li className="command-history-entry" data-expanded={isExpanded}>
      <button
        className="command-history-row"
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-hint command-history-time">{time}</span>
        <span className="command-past truncate grow">{record.typedCommand}</span>
        <StatusMark exitCode={record.exitCode} />
      </button>
      {isExpanded && (
        <div className="command-history-details">
          {record.differsFromTyped && (
            <div className="command-pair">
              <span className="text-small">You&apos;d type</span>
              <span className="command-past">{record.typedCommand}</span>
              <span className="text-small">Ran</span>
              <span className="mono">{record.ranCommand}</span>
            </div>
          )}
          <div className="command-pair">
            <span className="text-small">Exact</span>
            <span className="mono text-small">{record.exactCommand}</span>
          </div>
          {record.output !== '' && <div className="output">{record.output}</div>}
          <div>
            <button
              className="button"
              type="button"
              onClick={() => void window.api.copyText(record.typedCommand)}
            >
              Copy command
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

export function CommandHistory({
  records,
  onClose
}: {
  records: CommandRecord[]
  onClose(): void
}): React.JSX.Element {
  return (
    <section className="command-history" aria-label="Commands">
      <div className="command-history-head">
        <h2 className="text-head">Commands</h2>
        <button className="button button-quiet" type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <ul className="command-history-list">
        {records.map((record, index) => (
          // Newest first, so counting from the end keeps each entry's key stable.
          <HistoryEntry key={records.length - index} record={record} />
        ))}
      </ul>
    </section>
  )
}
