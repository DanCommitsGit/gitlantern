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
      {preview.ranCommand && <span className="text-small text-ink-2">You&apos;d type</span>}
      <span className="command min-w-0 flex-1 truncate">{preview.typedCommand}</span>
      {preview.ranCommand ? (
        <>
          <span className="text-small text-ink-2">Runs</span>
          <span className="font-mono text-small text-ink-3">{preview.ranCommand}</span>
        </>
      ) : (
        <span className="text-small text-ink-3">{preview.explanation}</span>
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
    <footer className="flex-none border-t border-line bg-sunken">
      {isHistoryOpen && (
        <CommandHistory records={records} onClose={() => setIsHistoryOpen(false)} />
      )}
      <div className="flex min-h-8.5 items-center gap-2 px-3 whitespace-nowrap">
        <Terminal className="size-4 flex-none text-ink-3" />
        {preview ? (
          <PreviewLine preview={preview} />
        ) : lastRecord ? (
          <>
            <span className="command-past min-w-0 flex-1 truncate">{lastRecord.typedCommand}</span>
            {lastRecord.exitCode !== 0 && <span className="text-small text-attn">Failed</span>}
            <span className="text-small text-ink-3">
              {formatTimeAgo(lastRecord.finishedAt, Math.max(now, lastRecord.finishedAt))}
            </span>
          </>
        ) : (
          <span className="min-w-0 flex-1" />
        )}
        <button
          className="button button-quiet focus-visible:-outline-offset-2"
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
