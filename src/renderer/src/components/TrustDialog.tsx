import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { RepositoryProgramSummary } from '../../../shared/gitlantern-api'

interface TrustDialogProps {
  path: string
  programs: RepositoryProgramSummary[]
  onTrust(): void
  onCancel(): void
}

export function TrustDialog({
  path,
  programs,
  onTrust,
  onCancel
}: TrustDialogProps): React.JSX.Element {
  return (
    <AlertDialog.Root open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="dialog-backdrop" />
        <AlertDialog.Popup className="dialog">
          <AlertDialog.Title className="text-title">
            This repository can run programs on your computer
          </AlertDialog.Title>
          <p className="mono text-small">{path}</p>
          <AlertDialog.Description>
            Its settings tell git to run the commands below. Only continue if you trust where this
            folder came from.
          </AlertDialog.Description>
          <ul className="output">
            {programs.map((program) => (
              <li key={`${program.kind}:${program.name}`}>
                {program.kind === 'setting'
                  ? `${program.name} = ${program.value}`
                  : `hooks/${program.name}`}
              </li>
            ))}
          </ul>
          <div className="row-layout" style={{ justifyContent: 'flex-end' }}>
            <AlertDialog.Close className="button" onClick={onCancel}>
              Don&apos;t open
            </AlertDialog.Close>
            <button className="button button-primary" type="button" onClick={onTrust}>
              Trust and open
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
