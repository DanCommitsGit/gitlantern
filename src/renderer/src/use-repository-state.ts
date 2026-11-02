import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RepositoryStatus } from '../../shared/repository-types'
import { resolveSelectedChange, type FileSelection, type SelectedChange } from './selected-change'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export interface RepositoryState {
  status: RepositoryStatus | null
  selected: SelectedChange | null
  errorMessage: string | null
  select(selection: FileSelection): void
}

export function useRepositoryState(): RepositoryState {
  const [status, setStatus] = useState<RepositoryStatus | null>(null)
  const [selection, setSelection] = useState<FileSelection | null>(null)
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

  return {
    status,
    selected,
    errorMessage: readError,
    select: setSelection
  }
}
