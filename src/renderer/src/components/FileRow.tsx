import type { LucideIcon } from 'lucide-react'
import type { FileChange, FileStatus } from '../../../shared/repository-types'
import type { CommandPreview } from '../command-preview'
import { CommandButton } from './CommandButton'

const STATUS_CLASSES: Record<FileStatus, string> = {
  M: 'status-changed',
  T: 'status-changed',
  R: 'status-changed',
  C: 'status-changed',
  A: 'status-added',
  D: 'status-deleted',
  '?': 'status-untracked',
  U: 'status-conflict'
}

interface FileRowProps {
  change: FileChange
  isSelected: boolean
  isPartlyStaged: boolean
  actionLabel: string
  actionIcon: LucideIcon
  actionPreview: CommandPreview
  onSelect(): void
  onAction(): void
}

export function FileRow({
  change,
  isSelected,
  isPartlyStaged,
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
        <span className={`status-badge ${STATUS_CLASSES[change.status]}`}>{change.status}</span>
        <span className="truncate grow">{change.path}</span>
        {isPartlyStaged && <span className="pill pill-plain">Part</span>}
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
