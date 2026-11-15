import { useState, type KeyboardEvent } from 'react'
import type { CommandRecord } from '../../../shared/command-record'
import { commitAction } from '../../../shared/git-actions'
import type { Identity } from '../../../shared/gitlantern-api'
import { previewAction } from '../command-preview'
import { useSettings } from '../settings/settings-context'
import { GLOSSARY } from '../glossary'
import { CommandButton } from './CommandButton'
import { Hint } from './Hint'

// The checkbox list has no Staged list, so the button says how many files go in.
function commitButtonLabel(branchName: string | null, fileCount: number): string {
  const files = fileCount === 0 ? '' : ` ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`
  return branchName === null ? `Commit${files}` : `Commit${files} to ${branchName}`
}

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
  const { fileList } = useSettings().settings

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
      <div className="flex items-center justify-between gap-2">
        <label className="text-label text-ink-2" htmlFor="commit-summary">
          <Hint entry={GLOSSARY.summary}>Summary</Hint>
        </label>
        <span className="text-small text-ink-3">{summary.length > 0 ? summary.length : ''}</span>
      </div>
      <input
        className="input"
        id="commit-summary"
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
      />
      <label className="text-label text-ink-2" htmlFor="commit-description">
        <Hint entry={GLOSSARY.description}>Description</Hint>
      </label>
      <textarea
        className="input block resize-none"
        id="commit-description"
        rows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      {failureMessage !== null && <div className="banner banner-danger">{failureMessage}</div>}
      {branchName === null && (
        <p className="text-small text-attn">
          You&apos;re not on a branch. New commits here won&apos;t belong to any branch.
        </p>
      )}
      <CommandButton
        className="button button-primary min-h-8.5 px-3.5"
        disabled={!canCommit}
        preview={previewAction(
          commitAction(trimmedSummary, description),
          'Saves the staged changes as a new point in history'
        )}
        onClick={() => void commit()}
      >
        {commitButtonLabel(branchName, fileList === 'checkboxes' ? stagedCount : 0)}
      </CommandButton>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-small text-ink-3">
          {stagedCount === 0
            ? 'Stage a file to commit it.'
            : `As ${identity.name}, ${identity.email}`}
        </span>
        <span className="flex-none text-small text-ink-3">{shortcutLabel}</span>
      </div>
    </div>
  )
}
