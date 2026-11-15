import { Minus, Plus } from 'lucide-react'
import type { CommandRecord } from '../../../shared/command-record'
import type { FileChange, RepositoryStatus } from '../../../shared/repository-types'
import {
  pathsOf,
  stageAllPreview,
  stageFilePreview,
  unstageAllPreview,
  unstageFilePreview
} from '../file-action-previews'
import { GLOSSARY } from '../glossary'
import type { FileSelection, SelectedChange } from '../selected-change'
import { CommandButton } from './CommandButton'
import { FileRow } from './FileRow'
import { Hint } from './Hint'

interface FileListsProps {
  status: RepositoryStatus
  selected: SelectedChange | null
  onSelect(selection: FileSelection): void
  runCommand(command: () => Promise<CommandRecord>): void
}

export function FileLists({
  status,
  selected,
  onSelect,
  runCommand
}: FileListsProps): React.JSX.Element {
  const isSelected = (change: FileChange, staged: boolean): boolean =>
    selected !== null && selected.staged === staged && selected.change.path === change.path

  return (
    <div className="file-lists">
      <div className="pane-head">
        <span className="min-w-0 flex-1">
          <Hint entry={GLOSSARY.unstaged}>Unstaged</Hint>
        </span>
        <span className="text-small text-ink-3">{status.unstaged.length}</span>
        {status.unstaged.length > 0 && (
          <CommandButton
            className="button button-quiet"
            preview={stageAllPreview()}
            onClick={() => runCommand(() => window.api.stageAll())}
          >
            Stage all
          </CommandButton>
        )}
      </div>
      <ul>
        {status.unstaged.map((change) => (
          <FileRow
            key={change.path}
            change={change}
            isSelected={isSelected(change, false)}
            actionLabel="Stage"
            actionIcon={Plus}
            actionPreview={stageFilePreview(change.path)}
            onSelect={() => onSelect({ path: change.path, staged: false })}
            onAction={() => runCommand(() => window.api.stageFiles([change.path]))}
          />
        ))}
      </ul>

      <div className="pane-head border-t border-line">
        <span className="min-w-0 flex-1">
          <Hint entry={GLOSSARY.staged}>Staged</Hint>
        </span>
        <span className="text-small text-ink-3">{status.staged.length}</span>
        {status.staged.length > 0 && (
          <CommandButton
            className="button button-quiet"
            preview={unstageAllPreview(status.hasCommits)}
            onClick={() => runCommand(() => window.api.unstageAll())}
          >
            Unstage all
          </CommandButton>
        )}
      </div>
      <ul>
        {status.staged.map((change) => (
          <FileRow
            key={change.path}
            change={change}
            isSelected={isSelected(change, true)}
            actionLabel="Unstage"
            actionIcon={Minus}
            actionPreview={unstageFilePreview(change, status.hasCommits)}
            onSelect={() => onSelect({ path: change.path, staged: true })}
            onAction={() => runCommand(() => window.api.unstageFiles(pathsOf(change)))}
          />
        ))}
      </ul>
    </div>
  )
}
