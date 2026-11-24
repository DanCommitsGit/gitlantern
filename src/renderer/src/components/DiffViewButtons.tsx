import { DIFF_VIEW_MODES, type DiffViewMode } from '../../../shared/settings'
import { DIFF_VIEW_LABELS } from '../diff-view-mode'

interface DiffViewButtonsProps {
    shownMode: DiffViewMode
    splitFits: boolean
    onChoose(mode: DiffViewMode): void
}

export function DiffViewButtons({ shownMode, splitFits, onChoose }: DiffViewButtonsProps): React.JSX.Element {
    return (
        <div className="segmented" role="group" aria-label="Diff view">
            {DIFF_VIEW_MODES.map((mode) => {
                const isBlocked = mode === 'split' && !splitFits
                return (
                    <button
                        key={mode}
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
