import { DIFF_VIEW_LABELS, DIFF_VIEW_MODES, type DiffViewMode } from '../diff-view-mode'

interface DiffViewButtonsProps {
  shownMode: DiffViewMode
  splitFits: boolean
  onChoose(mode: DiffViewMode): void
}

export function DiffViewButtons({
  shownMode,
  splitFits,
  onChoose
}: DiffViewButtonsProps): React.JSX.Element {
  return (
    <div
      className="inline-flex flex-none rounded-md border border-line-strong"
      role="group"
      aria-label="Diff view"
    >
      {DIFF_VIEW_MODES.map((mode) => {
        const isBlocked = mode === 'split' && !splitFits
        return (
          <button
            key={mode}
            className="min-h-6.5 cursor-pointer bg-raised px-2.5 font-medium whitespace-nowrap text-ink-2 not-first:border-l not-first:border-line-strong first:rounded-l-[calc(var(--radius-md)-1px)] last:rounded-r-[calc(var(--radius-md)-1px)] focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:text-ink-3 aria-pressed:bg-selected aria-pressed:text-ink"
            type="button"
            aria-pressed={mode === shownMode}
            disabled={isBlocked}
            onClick={() => onChoose(mode)}
          >
            {isBlocked ? 'Needs a wider window' : DIFF_VIEW_LABELS[mode]}
          </button>
        )
      })}
    </div>
  )
}
