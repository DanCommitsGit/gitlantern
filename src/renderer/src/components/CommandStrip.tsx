import { Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CommandRecord } from '../../../shared/command-record'
import type { CommandPreview } from '../command-preview'
import { formatTimeAgo } from '../time-ago'
import { CommandHistory } from './CommandHistory'

const TIME_REFRESH_MILLISECONDS = 30_000

interface CommandStripProps {
  preview: CommandPreview | null
  records: CommandRecord[]
}

function PreviewLine({ preview }: { preview: CommandPreview }): React.JSX.Element {
  return (
    <>
      {preview.ranCommand && <span className="text-small">You&apos;d type</span>}
      <span className="command truncate grow">{preview.typedCommand}</span>
      {preview.ranCommand ? (
        <>
          <span className="text-small">Runs</span>
          <span className="mono text-hint">{preview.ranCommand}</span>
        </>
      ) : (
        <span className="text-hint">{preview.explanation}</span>
      )}
    </>
  )
}

export function CommandStrip({ preview, records }: CommandStripProps): React.JSX.Element {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const lastRecord = records.at(0) ?? null

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TIME_REFRESH_MILLISECONDS)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer className="command-strip">
      {isHistoryOpen && (
        <CommandHistory records={records} onClose={() => setIsHistoryOpen(false)} />
      )}
      <div className="command-strip-line">
        <Terminal className="icon command-strip-prompt" />
        {preview ? (
          <PreviewLine preview={preview} />
        ) : lastRecord ? (
          <>
            <span className="command-past truncate grow">{lastRecord.typedCommand}</span>
            {lastRecord.exitCode !== 0 && <span className="text-small text-attention">Failed</span>}
            <span className="text-hint">
              {formatTimeAgo(lastRecord.finishedAt, Math.max(now, lastRecord.finishedAt))}
            </span>
          </>
        ) : (
          <span className="grow" />
        )}
        <button
          className="button button-quiet"
          type="button"
          aria-expanded={isHistoryOpen}
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
        >
          History
        </button>
      </div>
    </footer>
  )
}
