import { useState, type KeyboardEvent } from 'react'
import type { CommandRecord } from '../../../shared/command-record'
import { commitAction } from '../../../shared/git-actions'
import type { Identity } from '../../../shared/gitlantern-api'
import { previewAction } from '../command-preview'
import { CommandButton } from './CommandButton'

interface CommitFormProps {
  branchName: string | null
  stagedCount: number
  identity: Identity
  runCommand(command: () => Promise<CommandRecord>): Promise<CommandRecord | null>
}

export function CommitForm({
  branchName,
  stagedCount,
  identity,
  runCommand
}: CommitFormProps): React.JSX.Element {
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [failureMessage, setFailureMessage] = useState<string | null>(null)

  const trimmedSummary = summary.trim()
  const canCommit = stagedCount > 0 && trimmedSummary !== ''
  const shortcutLabel = window.api.platform === 'darwin' ? 'Cmd+Enter' : 'Ctrl+Enter'

  async function commit(): Promise<void> {
    if (!canCommit) return

    const record = await runCommand(() => window.api.commit(trimmedSummary, description))
    if (record === null) return
    if (record.exitCode === 0) {
      setSummary('')
      setDescription('')
      setFailureMessage(null)
    } else {
      setFailureMessage(record.output)
    }
  }

  function commitOnShortcut(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      void commit()
    }
  }

  return (
    <div className="commit-form" onKeyDown={commitOnShortcut}>
      <div className="row-layout" style={{ justifyContent: 'space-between' }}>
        <label className="text-label" htmlFor="commit-summary">
          Summary
        </label>
        <span className="text-hint">{summary.length > 0 ? summary.length : ''}</span>
      </div>
      <input
        className="input"
        id="commit-summary"
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
      />
      <label className="text-label" htmlFor="commit-description">
        Description
      </label>
      <textarea
        className="input textarea"
        id="commit-description"
        rows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      {failureMessage !== null && <div className="banner banner-danger">{failureMessage}</div>}
      {branchName === null && (
        <p className="text-small text-attention">
          You&apos;re not on a branch. New commits here won&apos;t belong to any branch.
        </p>
      )}
      <CommandButton
        className="button button-primary button-large"
        disabled={!canCommit}
        preview={previewAction(
          commitAction(trimmedSummary, description),
          'Saves the staged changes as a new point in history'
        )}
        onClick={() => void commit()}
      >
        {branchName === null ? 'Commit' : `Commit to ${branchName}`}
      </CommandButton>
      <div className="row-layout" style={{ justifyContent: 'space-between' }}>
        <span className="text-hint truncate">
          {stagedCount === 0
            ? 'Stage a file to commit it.'
            : `As ${identity.name}, ${identity.email}`}
        </span>
        <span className="text-hint" style={{ flex: 'none' }}>
          {shortcutLabel}
        </span>
      </div>
    </div>
  )
}
