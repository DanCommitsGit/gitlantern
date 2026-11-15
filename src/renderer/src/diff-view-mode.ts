export const DIFF_VIEW_MODES = ['unified', 'split', 'words'] as const

export type DiffViewMode = (typeof DIFF_VIEW_MODES)[number]

export const DIFF_VIEW_LABELS: Record<DiffViewMode, string> = {
  unified: 'Unified',
  split: 'Split',
  words: 'Words'
}

// Below this diff pane width, Split shows as Unified.
export const SPLIT_MIN_WIDTH = 700

const STORAGE_KEY = 'diffViewMode'

export function loadDiffViewMode(): DiffViewMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return DIFF_VIEW_MODES.find((mode) => mode === saved) ?? 'unified'
  } catch {
    return 'unified'
  }
}

export function saveDiffViewMode(mode: DiffViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // The view still switches; it just won't be remembered.
  }
}
