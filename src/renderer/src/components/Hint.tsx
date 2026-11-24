import { Tooltip } from '@base-ui/react/tooltip'
import type { ReactNode } from 'react'
import type { GlossaryEntry } from '../glossary'

export function Hint({ entry, children }: { entry: GlossaryEntry; children: ReactNode }): React.JSX.Element {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger render={<span className="cursor-help" tabIndex={0} />}>
                {children}
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={6} align="start">
                    <Tooltip.Popup className="popover-card">
                        <strong>{entry.term}</strong>
                        <span className="text-ink-2">{entry.explanation}</span>
                        {entry.command && <span className="command">{entry.command}</span>}
                    </Tooltip.Popup>
                </Tooltip.Positioner>
            </Tooltip.Portal>
        </Tooltip.Root>
    )
}
