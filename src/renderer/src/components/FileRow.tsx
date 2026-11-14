import type { LucideIcon } from 'lucide-react'
import type { FileChange } from '../../../shared/repository-types'
import type { CommandPreview } from '../command-preview'
import { CommandButton } from './CommandButton'
import { StatusBadge } from './StatusBadge'

interface FileRowProps {
  change: FileChange
  isSelected: boolean
  actionLabel: string
  actionIcon: LucideIcon
  actionPreview: CommandPreview
  onSelect(): void
  onAction(): void
}

export function FileRow({
  change,
  isSelected,
  actionLabel,
  actionIcon: ActionIcon,
  actionPreview,
  onSelect,
  onAction
}: FileRowProps): React.JSX.Element {
  return (
    <li className="file-row" data-selected={isSelected}>
      <button
        className="file-row-select"
        type="button"
        title={change.originalPath ? `${change.originalPath} → ${change.path}` : change.path}
        aria-current={isSelected}
        onClick={onSelect}
      >
        <StatusBadge status={change.status} />
        <span className="truncate grow">{change.path}</span>
      </button>
      <CommandButton
        className="button button-quiet button-icon file-row-action"
        aria-label={`${actionLabel} ${change.path}`}
        preview={actionPreview}
        onClick={onAction}
      >
        <ActionIcon className="icon" />
      </CommandButton>
    </li>
  )
}
