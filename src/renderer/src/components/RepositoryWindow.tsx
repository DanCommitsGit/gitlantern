import type { OpenedRepository } from '../../../shared/gitlantern-api'
import { useRepositoryState } from '../use-repository-state'
import { DiffView } from './DiffView'
import { FileLists } from './FileLists'
import { Rail } from './Rail'
import { TitleBar } from './TitleBar'

interface RepositoryWindowProps {
  repository: OpenedRepository
  onClose(): void
}

export function RepositoryWindow({
  repository,
  onClose
}: RepositoryWindowProps): React.JSX.Element {
  const state = useRepositoryState()
  const { status } = state

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
      {state.errorMessage !== null && (
        <div className="banner banner-danger" style={{ borderRadius: 0 }}>
          {state.errorMessage}
        </div>
      )}
      {status && (
        <div className="window-body">
          <Rail branchName={status.branchName} />
          <section className="pane file-pane">
            <FileLists status={status} selected={state.selected} onSelect={state.select} />
          </section>
          <DiffView selected={state.selected} diff={state.diff} onShowLarge={state.showLargeDiff} />
        </div>
      )}
    </div>
  )
}
