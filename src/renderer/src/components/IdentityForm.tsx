import { useState, type FormEvent } from 'react'
import { saveIdentityActions } from '../../../shared/git-actions'
import type { Identity } from '../../../shared/gitlantern-api'
import { previewAction } from '../command-preview'
import { CommandButton } from './CommandButton'

interface IdentityFormProps {
  identity: Identity
  onSave(name: string, email: string): void
}

export function IdentityForm({ identity, onSave }: IdentityFormProps): React.JSX.Element {
  const [name, setName] = useState(identity.name ?? '')
  const [email, setEmail] = useState(identity.email ?? '')

  const trimmedName = name.trim()
  const trimmedEmail = email.trim()
  const canSave = trimmedName !== '' && trimmedEmail !== ''

  function save(event: FormEvent): void {
    event.preventDefault()
    if (canSave) onSave(trimmedName, trimmedEmail)
  }

  return (
    <form className="commit-form" onSubmit={save}>
      <h2 className="text-head">Git needs your name and email</h2>
      <p className="text-small">Commits record who made them.</p>
      <div className="field">
        <label className="text-label" htmlFor="identity-name">
          Name
        </label>
        <input
          className="input"
          id="identity-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label className="text-label" htmlFor="identity-email">
          Email
        </label>
        <input
          className="input"
          id="identity-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <CommandButton
        className="button button-primary"
        type="submit"
        disabled={!canSave}
        preview={previewAction(
          saveIdentityActions(trimmedName, trimmedEmail)[0],
          'Saves your name and email for every repository on this computer'
        )}
      >
        Save
      </CommandButton>
    </form>
  )
}
