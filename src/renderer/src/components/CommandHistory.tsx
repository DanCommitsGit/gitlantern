import { Check, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import type { CommandRecord } from '../../../shared/command-record'

function StatusMark({ exitCode }: { exitCode: number }): React.JSX.Element {
    return exitCode === 0 ? (
        <Check className="size-4 flex-none text-ok" role="img" aria-label="Succeeded" />
    ) : (
        <>
            <TriangleAlert className="size-4 flex-none text-attn" />
            <span className="text-small text-attn">Failed</span>
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
        <li className="data-[expanded=true]:bg-selected" data-expanded={isExpanded}>
            <button
                className="flex min-h-7 w-full cursor-pointer items-center gap-2 px-3 py-0.5 text-left hover:bg-hover focus-visible:-outline-offset-2"
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="w-15 flex-none text-small text-ink-3">{time}</span>
                <span className="command-past min-w-0 flex-1 truncate">{record.typedCommand}</span>
                <StatusMark exitCode={record.exitCode} />
            </button>
            {isExpanded && (
                <div className="flex flex-col gap-2 pt-1 pr-3 pb-2.5 pl-20">
                    {record.differsFromTyped && (
                        <div className="grid grid-cols-[70px_minmax(0,1fr)] items-baseline gap-x-2 gap-y-0.5 wrap-anywhere">
                            <span className="text-small text-ink-2">You&apos;d type</span>
                            <span className="command-past">{record.typedCommand}</span>
                            <span className="text-small text-ink-2">Ran</span>
                            <span className="font-mono text-code">{record.ranCommand}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-[70px_minmax(0,1fr)] items-baseline gap-x-2 gap-y-0.5 wrap-anywhere">
                        <span className="text-small text-ink-2">Exact</span>
                        <span className="font-mono text-small text-ink-2">{record.exactCommand}</span>
                    </div>
                    {record.output !== '' && <div className="output bg-canvas">{record.output}</div>}
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
        <section className="flex max-h-[40vh] flex-col border-b border-line bg-canvas" aria-label="Commands">
            <div className="flex flex-none items-center justify-between border-b border-line px-3 py-2">
                <h2 className="text-head">Commands</h2>
                <button className="button button-quiet" type="button" onClick={onClose}>
                    Close
                </button>
            </div>
            <ul className="overflow-auto">
                {records.map((record, index) => (
                    // Newest first, so counting from the end keeps each entry's key stable.
                    <HistoryEntry key={records.length - index} record={record} />
                ))}
            </ul>
        </section>
    )
}
