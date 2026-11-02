import type { CommandRecord } from '../../../shared/command-record'
import type { FileChange, RepositoryStatus } from '../../../shared/repository-types'
import type { FileSelection, SelectedChange } from '../selected-change'
import { FileRow } from './FileRow'

const PLUS_ICON_PATH = 'M8 3v10M3 8h10'
const MINUS_ICON_PATH = 'M3 8h10'

interface FileListsProps {
  status: RepositoryStatus
  selected: SelectedChange | null
  onSelect(selection: FileSelection): void
  runCommand(command: () => Promise<CommandRecord>): void
}

function pathsOf(change: FileChange): string[] {
  return change.originalPath === undefined ? [change.path] : [change.path, change.originalPath]
}

export function FileLists({
  status,
  selected,
  onSelect,
  runCommand
}: FileListsProps): React.JSX.Element {
  const isSelected = (change: FileChange, staged: boolean): boolean =>
    selected !== null && selected.staged === staged && selected.change.path === change.path
  const stagedPaths = new Set(status.staged.map((change) => change.path))
  const unstagedPaths = new Set(status.unstaged.map((change) => change.path))

  return (
    <div className="file-lists">
      <div className="pane-head">
        <span className="grow">Unstaged</span>
        <span className="text-hint">{status.unstaged.length}</span>
        {status.unstaged.length > 0 && (
          <button
            className="button button-quiet"
            type="button"
            onClick={() => runCommand(() => window.api.stageAll())}
          >
            Stage all
          </button>
        )}
      </div>
      <ul>
        {status.unstaged.map((change) => (
          <FileRow
            key={change.path}
            change={change}
            isSelected={isSelected(change, false)}
            isPartlyStaged={stagedPaths.has(change.path)}
            actionLabel="Stage"
            actionIconPath={PLUS_ICON_PATH}
            onSelect={() => onSelect({ path: change.path, staged: false })}
            onAction={() => runCommand(() => window.api.stageFiles([change.path]))}
          />
        ))}
      </ul>

      <div className="pane-head file-list-staged-head">
        <span className="grow">Staged</span>
        <span className="text-hint">{status.staged.length}</span>
        {status.staged.length > 0 && (
          <button
            className="button button-quiet"
            type="button"
            onClick={() => runCommand(() => window.api.unstageAll())}
          >
            Unstage all
          </button>
        )}
      </div>
      <ul>
        {status.staged.map((change) => (
          <FileRow
            key={change.path}
            change={change}
            isSelected={isSelected(change, true)}
            isPartlyStaged={unstagedPaths.has(change.path)}
            actionLabel="Unstage"
            actionIconPath={MINUS_ICON_PATH}
            onSelect={() => onSelect({ path: change.path, staged: true })}
            onAction={() => runCommand(() => window.api.unstageFiles(pathsOf(change)))}
          />
        ))}
      </ul>
    </div>
  )
}
