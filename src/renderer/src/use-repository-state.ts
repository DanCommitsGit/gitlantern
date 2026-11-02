import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FileDiff, RepositoryStatus } from '../../shared/repository-types'
import { resolveSelectedChange, type FileSelection, type SelectedChange } from './selected-change'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export interface RepositoryState {
  status: RepositoryStatus | null
  selected: SelectedChange | null
  diff: FileDiff | null
  errorMessage: string | null
  select(selection: FileSelection): void
  showLargeDiff(): void
}

export function useRepositoryState(): RepositoryState {
  const [status, setStatus] = useState<RepositoryStatus | null>(null)
  const [selection, setSelection] = useState<FileSelection | null>(null)
  const [diff, setDiff] = useState<FileDiff | null>(null)
  const [largeDiffPath, setLargeDiffPath] = useState<string | null>(null)
  const [readError, setReadError] = useState<string | null>(null)

  const refresh = useCallback(
    () =>
      window.api.readStatus().then(
        (nextStatus) => {
          setStatus(nextStatus)
          setReadError(null)
        },
        (error) => setReadError(errorMessage(error))
      ),
    []
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  const selected = useMemo(
    () => (status === null ? null : resolveSelectedChange(status, selection)),
    [status, selection]
  )

  useEffect(() => {
    if (selected === null) return

    let isCurrent = true
    const showLarge = largeDiffPath === selected.change.path
    window.api.readDiff(selected.change, selected.staged, showLarge).then(
      (nextDiff) => {
        if (isCurrent) setDiff(nextDiff)
      },
      (error) => {
        if (isCurrent) setReadError(errorMessage(error))
      }
    )
    return () => {
      isCurrent = false
    }
  }, [selected, largeDiffPath])

  return {
    status,
    selected,
    diff: selected === null ? null : diff,
    errorMessage: readError,
    select: setSelection,
    showLargeDiff: () => setLargeDiffPath(selected?.change.path ?? null)
  }
}
