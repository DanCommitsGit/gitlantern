import { useEffect, useState } from 'react'
import type { FileChange, FileDiff } from '../../shared/repository-types'
import { errorMessage } from './error-message'

export interface CommitFiles {
  // null until the commit's files arrive.
  files: FileChange[] | null
  selectedFile: FileChange | null
  diff: FileDiff | null
  errorMessage: string | null
  selectFile(path: string): void
  showLargeDiff(): void
}

interface LoadedFiles {
  commitHash: string
  files: FileChange[]
}

interface LoadedDiff {
  commitHash: string
  path: string
  diff: FileDiff
}

export function useCommitFiles(commitHash: string | null): CommitFiles {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFiles | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [loadedDiff, setLoadedDiff] = useState<LoadedDiff | null>(null)
  const [largeDiffKey, setLargeDiffKey] = useState<string | null>(null)
  const [readError, setReadError] = useState<string | null>(null)

  const files = loadedFiles?.commitHash === commitHash ? loadedFiles.files : null
  const selectedFile = files?.find((file) => file.path === selectedPath) ?? files?.[0] ?? null

  useEffect(() => {
    if (commitHash === null) return

    let isCurrent = true
    window.api.readCommitFiles(commitHash).then(
      (nextFiles) => {
        if (!isCurrent) return
        setLoadedFiles({ commitHash, files: nextFiles })
        setReadError(null)
      },
      (error) => {
        if (isCurrent) setReadError(errorMessage(error))
      }
    )
    return () => {
      isCurrent = false
    }
  }, [commitHash])

  useEffect(() => {
    if (commitHash === null || selectedFile === null) return

    let isCurrent = true
    const showLarge = largeDiffKey === `${commitHash}:${selectedFile.path}`
    window.api.readCommitDiff(commitHash, selectedFile, showLarge).then(
      (diff) => {
        if (isCurrent) setLoadedDiff({ commitHash, path: selectedFile.path, diff })
      },
      (error) => {
        if (isCurrent) setReadError(errorMessage(error))
      }
    )
    return () => {
      isCurrent = false
    }
  }, [commitHash, selectedFile, largeDiffKey])

  const isDiffCurrent =
    loadedDiff !== null &&
    loadedDiff.commitHash === commitHash &&
    loadedDiff.path === selectedFile?.path

  return {
    files,
    selectedFile,
    diff: isDiffCurrent ? loadedDiff.diff : null,
    errorMessage: readError,
    selectFile: setSelectedPath,
    showLargeDiff: () =>
      setLargeDiffKey(selectedFile === null ? null : `${commitHash}:${selectedFile.path}`)
  }
}
