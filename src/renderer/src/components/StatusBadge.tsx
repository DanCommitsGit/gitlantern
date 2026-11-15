import type { FileStatus } from '../../../shared/repository-types'

const STATUS_CLASSES: Record<FileStatus, string> = {
  M: 'bg-info-tint text-info',
  T: 'bg-info-tint text-info',
  R: 'bg-info-tint text-info',
  C: 'bg-info-tint text-info',
  A: 'bg-ok-tint text-ok',
  D: 'bg-danger-tint text-danger',
  '?': 'bg-hover text-ink-2',
  U: 'bg-attn-tint text-attn'
}

export function StatusBadge({ status }: { status: FileStatus }): React.JSX.Element {
  return (
    <span
      className={`inline-flex size-4 flex-none items-center justify-center rounded-sm font-mono text-small leading-none font-semibold ${STATUS_CLASSES[status]}`}
    >
      {status}
    </span>
  )
}
