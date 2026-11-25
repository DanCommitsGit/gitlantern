import type { Identity } from '../../../shared/gitlantern-api'
import type { RepositoryStatus } from '../../../shared/repository-types'
import { pathLabelOf } from '../changed-files'
import { useSettings } from '../settings/settings-context'
import type { RepositoryState } from '../use-repository-state'
import { CommitForm } from './CommitForm'
import { DiffMessage } from './DiffMessage'
import { DiffView } from './DiffView'
import { FileChecklist } from './FileChecklist'
import { FileLists } from './FileLists'
import { IdentityForm } from './IdentityForm'

interface ChangesViewProps {
    status: RepositoryStatus
    state: RepositoryState
    identity: Identity
    onSaveIdentity(name: string, email: string): void
}

export function ChangesView({
    status,
    state,
    identity,
    onSaveIdentity
}: ChangesViewProps): React.JSX.Element {
    const FileList = useSettings().settings.fileList === 'checkboxes' ? FileChecklist : FileLists
    const { selected } = state

    return (
        <>
            <section className="pane w-80 flex-none">
                <FileList
                    status={status}
                    selected={selected}
                    onSelect={state.select}
                    runCommand={(command) => void state.runCommand(command)}
                />
                {identity.name === null || identity.email === null ? (
                    <IdentityForm identity={identity} onSave={onSaveIdentity} />
                ) : (
                    <CommitForm
                        branchName={status.branchName}
                        stagedCount={status.staged.length}
                        identity={identity}
                        runCommand={state.runCommand}
                    />
                )}
            </section>
            <DiffView
                title={
                    selected &&
                    `${pathLabelOf(selected.change)}${selected.staged ? ', staged' : ', unstaged'}`
                }
                diff={state.diff}
                onShowLarge={state.showLargeDiff}
            >
                {status.hasCommits ? (
                    <DiffMessage
                        title="Nothing to commit"
                        message="Your files match the last commit. Edit something and it will show up here."
                    />
                ) : (
                    <DiffMessage
                        title="No commits yet"
                        message="This repository is empty. Add a file, stage it and make your first commit."
                    />
                )}
            </DiffView>
        </>
    )
}
