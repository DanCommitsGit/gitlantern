import { useState } from 'react'
import type { CommandRecord } from '../../../shared/command-record'
import type { Identity, OpenedRepository } from '../../../shared/gitlantern-api'
import { SetCommandPreviewContext, type CommandPreview } from '../command-preview'
import { useRepositoryState } from '../use-repository-state'
import { CommandStrip } from './CommandStrip'
import { CommitForm } from './CommitForm'
import { DiffView } from './DiffView'
import { FileLists } from './FileLists'
import { IdentityForm } from './IdentityForm'
import { Rail } from './Rail'
import { TitleBar } from './TitleBar'

interface RepositoryWindowProps {
  repository: OpenedRepository
  records: CommandRecord[]
  onRecord(record: CommandRecord): void
  onClose(): void
}

export function RepositoryWindow({
  repository,
  records,
  onRecord,
  onClose
}: RepositoryWindowProps): React.JSX.Element {
  const [preview, setPreview] = useState<CommandPreview | null>(null)
  const [identity, setIdentity] = useState<Identity>(repository.identity)
  const state = useRepositoryState(onRecord)
  const { status } = state

  async function saveIdentity(name: string, email: string): Promise<void> {
    const saved = await window.api.saveIdentity(name, email)
    saved.records.forEach(onRecord)
    setIdentity(saved.identity)
  }

  return (
    <SetCommandPreviewContext.Provider value={setPreview}>
      <div className="window">
        <TitleBar>
          <button className="button button-quiet" type="button" onClick={onClose}>
            {repository.name}
            <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </button>
          <nav className="tabs" aria-label="Views">
            <button className="tab" type="button" aria-current="page">
              Changes
            </button>
          </nav>
        </TitleBar>
        {state.errorMessage !== null && (
          <div className="banner banner-danger" style={{ borderRadius: 0 }}>
            {state.errorMessage}
          </div>
        )}
        {status && (
          <div className="window-body">
            <Rail branchName={status.branchName} />
            <section className="pane file-pane">
              <FileLists
                status={status}
                selected={state.selected}
                onSelect={state.select}
                runCommand={(command) => void state.runCommand(command)}
              />
              {identity.name === null || identity.email === null ? (
                <IdentityForm
                  identity={identity}
                  onSave={(name, email) => void saveIdentity(name, email)}
                />
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
              hasCommits={status.hasCommits}
              selected={state.selected}
              diff={state.diff}
              onShowLarge={state.showLargeDiff}
            />
          </div>
        )}
        <CommandStrip preview={preview} records={records} />
      </div>
    </SetCommandPreviewContext.Provider>
  )
}
