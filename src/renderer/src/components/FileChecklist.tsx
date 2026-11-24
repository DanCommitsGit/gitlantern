import type { CommandRecord } from '../../../shared/command-record'
import type { RepositoryStatus } from '../../../shared/repository-types'
import { displayedChangeOf, listChangedFiles, stagedStateOf, type ChangedFile } from '../changed-files'
import type { CommandPreview } from '../command-preview'
import {
    pathsOf,
    stageAllPreview,
    stageFilePreview,
    stageRestOfFilePreview,
    unstageAllPreview,
    unstageFilePreview
} from '../file-action-previews'
import type { FileSelection, SelectedChange } from '../selected-change'
import { CommandControl } from './CommandControl'
import { StatusBadge } from './StatusBadge'

interface FileChecklistProps {
    status: RepositoryStatus
    selected: SelectedChange | null
    onSelect(selection: FileSelection): void
    runCommand(command: () => Promise<CommandRecord>): void
}

export function FileChecklist({
    status,
    selected,
    onSelect,
    runCommand
}: FileChecklistProps): React.JSX.Element {
    const files = listChangedFiles(status)
    const stagedCount = files.filter((file) => stagedStateOf(file) === 'staged').length
    const allStaged = files.length > 0 && stagedCount === files.length
    const noneStaged = status.staged.length === 0

    function toggleFile(file: ChangedFile): void {
        if (stagedStateOf(file) === 'staged' && file.staged) {
            const paths = pathsOf(file.staged)
            runCommand(() => window.api.unstageFiles(paths))
        } else {
            runCommand(() => window.api.stageFiles([file.path]))
        }
    }

    function filePreview(file: ChangedFile): CommandPreview {
        switch (stagedStateOf(file)) {
            case 'unstaged':
                return stageFilePreview(file.path)
            case 'partly-staged':
                return stageRestOfFilePreview(file.path)
            case 'staged':
                return unstageFilePreview(displayedChangeOf(file), status.hasCommits)
        }
    }

    return (
        <div className="list-scroll">
            <div className="pane-head">
                {files.length > 0 && (
                    <CommandControl
                        preview={allStaged ? unstageAllPreview(status.hasCommits) : stageAllPreview()}
                        render={
                            <input
                                className="flex-none cursor-pointer accent-ink"
                                type="checkbox"
                                aria-label="All changed files"
                                checked={allStaged}
                                ref={(input) => {
                                    if (input) input.indeterminate = !allStaged && !noneStaged
                                }}
                                onChange={() =>
                                    runCommand(() =>
                                        allStaged ? window.api.unstageAll() : window.api.stageAll()
                                    )
                                }
                            />
                        }
                    />
                )}
                <span className="min-w-0 flex-1">
                    {files.length} changed {files.length === 1 ? 'file' : 'files'}
                </span>
            </div>
            <ul>
                {files.map((file) => {
                    const state = stagedStateOf(file)
                    const change = displayedChangeOf(file)
                    return (
                        <li
                            key={file.path}
                            className="list-row pl-3"
                            data-selected={selected?.change.path === file.path}
                        >
                            <CommandControl
                                preview={filePreview(file)}
                                render={
                                    <input
                                        className="flex-none cursor-pointer accent-ink"
                                        type="checkbox"
                                        aria-label={file.path}
                                        checked={state === 'staged'}
                                        ref={(input) => {
                                            if (input) input.indeterminate = state === 'partly-staged'
                                        }}
                                        onChange={() => toggleFile(file)}
                                    />
                                }
                            />
                            <button
                                className="list-row-select pl-2"
                                type="button"
                                title={
                                    change.originalPath
                                        ? `${change.originalPath} → ${change.path}`
                                        : change.path
                                }
                                aria-current={selected?.change.path === file.path}
                                onClick={() => onSelect({ path: file.path, staged: state === 'staged' })}
                            >
                                <StatusBadge status={change.status} />
                                <span className="min-w-0 flex-1 truncate">{file.path}</span>
                                {state === 'partly-staged' && (
                                    <span className="pill bg-hover text-ink-2">Part</span>
                                )}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
