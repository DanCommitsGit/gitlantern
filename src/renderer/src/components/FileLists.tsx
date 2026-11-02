import type { FileChange, RepositoryStatus } from '../../../shared/repository-types'
import type { FileSelection, SelectedChange } from '../selected-change'
import { FileRow } from './FileRow'

interface FileListsProps {
  status: RepositoryStatus
  selected: SelectedChange | null
  onSelect(selection: FileSelection): void
}

export function FileLists({ status, selected, onSelect }: FileListsProps): React.JSX.Element {
  const isSelected = (change: FileChange, staged: boolean): boolean =>
    selected !== null && selected.staged === staged && selected.change.path === change.path
  const stagedPaths = new Set(status.staged.map((change) => change.path))
  const unstagedPaths = new Set(status.unstaged.map((change) => change.path))

  return (
    <div className="file-lists">
      <div className="pane-head">
        <span className="grow">Unstaged</span>
        <span className="text-hint">{status.unstaged.length}</span>
      </div>
      <ul>
        {status.unstaged.map((change) => (
          <FileRow
            key={change.path}
            change={change}
            isSelected={isSelected(change, false)}
            isPartlyStaged={stagedPaths.has(change.path)}
            onSelect={() => onSelect({ path: change.path, staged: false })}
          />
        ))}
      </ul>

      <div className="pane-head file-list-staged-head">
        <span className="grow">Staged</span>
        <span className="text-hint">{status.staged.length}</span>
      </div>
      <ul>
        {status.staged.map((change) => (
          <FileRow
            key={change.path}
            change={change}
            isSelected={isSelected(change, true)}
            isPartlyStaged={unstagedPaths.has(change.path)}
            onSelect={() => onSelect({ path: change.path, staged: true })}
          />
        ))}
      </ul>
    </div>
  )
}
