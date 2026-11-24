import type { DiffViewMode } from '../../shared/settings'

export const DIFF_VIEW_LABELS: Record<DiffViewMode, string> = {
    unified: 'Unified',
    split: 'Split',
    words: 'Words'
}

// Below this diff pane width, Split shows as Unified.
export const SPLIT_MIN_WIDTH = 700
