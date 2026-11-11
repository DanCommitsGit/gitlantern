import { Minus, Plus } from 'lucide-react'
import type { CommandRecord } from '../../../shared/command-record'
import {
  stageAllAction,
  stageFilesAction,
  unstageAllAction,
  unstageFilesAction
} from '../../../shared/git-actions'
import type { FileChange, RepositoryStatus } from '../../../shared/repository-types'
import { previewAction } from '../command-preview'
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
        <span className="grow">
          <Hint entry={GLOSSARY.unstaged}>Unstaged</Hint>
        </span>
        <span className="text-hint">{status.unstaged.length}</span>
        {status.unstaged.length > 0 && (
          <CommandButton
            className="button button-quiet"
            preview={previewAction(stageAllAction(), 'Stages every change')}
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
            isPartlyStaged={stagedPaths.has(change.path)}
            actionLabel="Stage"
            actionIcon={Plus}
            actionPreview={previewAction(
              stageFilesAction([change.path]),
              'Puts this file in the next commit'
            )}
            onSelect={() => onSelect({ path: change.path, staged: false })}
            onAction={() => runCommand(() => window.api.stageFiles([change.path]))}
          />
        ))}
      </ul>

      <div className="pane-head file-list-staged-head">
        <span className="grow">
          <Hint entry={GLOSSARY.staged}>Staged</Hint>
        </span>
        <span className="text-hint">{status.staged.length}</span>
        {status.staged.length > 0 && (
          <CommandButton
            className="button button-quiet"
            preview={previewAction(
              unstageAllAction(status.hasCommits),
              'Takes everything out of the next commit and keeps your files as they are'
            )}
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
            isPartlyStaged={unstagedPaths.has(change.path)}
            actionLabel="Unstage"
            actionIcon={Minus}
            actionPreview={previewAction(
              unstageFilesAction(pathsOf(change), status.hasCommits),
              'Takes this file out of the next commit and keeps it as it is'
            )}
            onSelect={() => onSelect({ path: change.path, staged: true })}
            onAction={() => runCommand(() => window.api.unstageFiles(pathsOf(change)))}
          />
        ))}
      </ul>
    </div>
  )
}
