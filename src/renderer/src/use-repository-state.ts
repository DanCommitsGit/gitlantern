import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CommandRecord } from '../../shared/command-record'
import type { Branch, FileDiff, RepositoryStatus } from '../../shared/repository-types'
import {
  resolveCheckboxSelection,
  resolveSelectedChange,
  type FileSelection,
  type SelectedChange
} from './selected-change'
import { errorMessage } from './error-message'
import { useSettings } from './settings/settings-context'

export interface RepositoryState {
  status: RepositoryStatus | null
  branches: Branch[]
  selected: SelectedChange | null
  diff: FileDiff | null
  errorMessage: string | null
  select(selection: FileSelection): void
  showLargeDiff(): void
  reportError(error: unknown): void
  runCommand(command: () => Promise<CommandRecord>): Promise<CommandRecord | null>
}

export function useRepositoryState(onRecord: (record: CommandRecord) => void): RepositoryState {
  const [status, setStatus] = useState<RepositoryStatus | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selection, setSelection] = useState<FileSelection | null>(null)
  const [diff, setDiff] = useState<FileDiff | null>(null)
  const [largeDiffPath, setLargeDiffPath] = useState<string | null>(null)
  const [readError, setReadError] = useState<string | null>(null)
  const { fileList } = useSettings().settings

  const refresh = useCallback(
    () =>
      Promise.all([window.api.readStatus(), window.api.readBranches()]).then(
        ([nextStatus, nextBranches]) => {
          setStatus(nextStatus)
          setBranches(nextBranches)
          setReadError(null)
        },
        (error) => setReadError(errorMessage(error))
      ),
    []
  )

  useEffect(() => {
    void refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  const selected = useMemo(() => {
    if (status === null) return null
    return fileList === 'checkboxes'
      ? resolveCheckboxSelection(status, selection)
      : resolveSelectedChange(status, selection)
  }, [status, selection, fileList])

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

  const runCommand = useCallback(
    async (command: () => Promise<CommandRecord>) => {
      try {
        const record = await command()
        onRecord(record)
        await refresh()
        return record
      } catch (error) {
        setReadError(errorMessage(error))
        return null
      }
    },
    [onRecord, refresh]
  )

  return {
    status,
    branches,
    selected,
    diff: selected === null ? null : diff,
    errorMessage: readError,
    select: setSelection,
    showLargeDiff: () => setLargeDiffPath(selected?.change.path ?? null),
    reportError: (error) => setReadError(errorMessage(error)),
    runCommand
  }
}
