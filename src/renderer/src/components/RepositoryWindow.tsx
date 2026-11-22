import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { CommandRecord } from '../../../shared/command-record'
import type { Identity, OpenedRepository } from '../../../shared/gitlantern-api'
import { SetCommandPreviewContext, type CommandPreview } from '../command-preview'
import { useRepositoryState } from '../use-repository-state'
import { ChangesView } from './ChangesView'
import { CommandStrip } from './CommandStrip'
import { HistoryView } from './HistoryView'
import { NoticeBanner } from './NoticeBanner'
import { RepositorySidebar } from './RepositorySidebar'
import { TitleBar } from './TitleBar'

const VIEWS = ['changes', 'history'] as const

type View = (typeof VIEWS)[number]

const VIEW_LABELS: Record<View, string> = { changes: 'Changes', history: 'History' }

// The view sits after the repository sidebar, a pane, so it takes over the border `.pane + .pane` would draw.
function viewClassName(isShown: boolean): string {
  return isShown ? 'flex min-w-0 flex-1 border-l border-line' : 'hidden'
}

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
  const [view, setView] = useState<View>('changes')
  // History reads the log only once it has been opened.
  const [hasOpenedHistory, setHasOpenedHistory] = useState(false)
  const { status } = state

  async function saveIdentity(name: string, email: string): Promise<void> {
    try {
      const saved = await window.api.saveIdentity(name, email)
      saved.records.forEach(onRecord)
      setIdentity(saved.identity)
    } catch (error) {
      state.reportError(error)
    }
  }

  return (
    <SetCommandPreviewContext value={setPreview}>
      <div className="window">
        <TitleBar>
          <button className="button button-quiet" type="button" onClick={onClose}>
            {repository.name}
            <ChevronDown className="size-4 flex-none" />
          </button>
          <nav className="flex gap-1" aria-label="Views">
            {VIEWS.map((viewName) => (
              <button
                key={viewName}
                className="min-h-7.5 cursor-pointer rounded-md px-3 font-medium text-ink-2 aria-[current=page]:bg-selected aria-[current=page]:font-semibold aria-[current=page]:text-ink"
                type="button"
                aria-current={viewName === view ? 'page' : undefined}
                onClick={() => {
                  setView(viewName)
                  if (viewName === 'history') setHasOpenedHistory(true)
                }}
              >
                {VIEW_LABELS[viewName]}
              </button>
            ))}
          </nav>
        </TitleBar>
        <NoticeBanner />
        {state.errorMessage !== null && (
          <div className="banner banner-danger rounded-none">{state.errorMessage}</div>
        )}
        {status && (
          <div className="flex min-h-0 flex-1">
            <RepositorySidebar
              branches={state.branches}
              currentBranchName={status.branchName}
              initialCollapsedBranchGroups={repository.collapsedBranchGroups}
            />
            {/* Both views stay mounted, so a half-written commit message survives a look at History. */}
            <div className={viewClassName(view === 'changes')}>
              <ChangesView
                status={status}
                state={state}
                identity={identity}
                onSaveIdentity={(name, email) => void saveIdentity(name, email)}
              />
            </div>
            {hasOpenedHistory && (
              <div className={viewClassName(view === 'history')}>
                <HistoryView
                  isShown={view === 'history'}
                  hasCommits={status.hasCommits}
                  onRecord={onRecord}
                />
              </div>
            )}
          </div>
        )}
        <CommandStrip preview={preview} records={records} />
      </div>
    </SetCommandPreviewContext>
  )
}
