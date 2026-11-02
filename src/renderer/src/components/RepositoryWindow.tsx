import type { OpenedRepository } from '../../../shared/gitlantern-api'
import { TitleBar } from './TitleBar'

interface RepositoryWindowProps {
  repository: OpenedRepository
  onClose(): void
}

export function RepositoryWindow({
  repository,
  onClose
}: RepositoryWindowProps): React.JSX.Element {
  return (
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
    </div>
  )
}
