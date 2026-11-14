import type { FileStatus } from '../../../shared/repository-types'

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

export function StatusBadge({ status }: { status: FileStatus }): React.JSX.Element {
  return <span className={`status-badge ${STATUS_CLASSES[status]}`}>{status}</span>
}
