import type { FileChange, FileStatus } from '../../../shared/repository-types'

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
  actionIconPath: string
  onSelect(): void
  onAction(): void
}

export function FileRow({
  change,
  isSelected,
  isPartlyStaged,
  actionLabel,
  actionIconPath,
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
      <button
        className="button button-quiet button-icon file-row-action"
        type="button"
        aria-label={`${actionLabel} ${change.path}`}
        onClick={onAction}
      >
        <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d={actionIconPath} />
        </svg>
      </button>
    </li>
  )
}
