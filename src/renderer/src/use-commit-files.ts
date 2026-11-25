import { useEffect, useState } from 'react'
import type { FileChange, FileDiff } from '../../shared/repository-types'
import { NOTIFICATION_SOURCES } from '../../shared/notifications'
import { errorMessage } from './error-message'
import { raiseNotification, resolveNotifications } from './notifications/raise-notification'

export interface CommitFiles {
    // null until the commit's files arrive.
    files: FileChange[] | null
    selectedFile: FileChange | null
    diff: FileDiff | null
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

    const files = loadedFiles?.commitHash === commitHash ? loadedFiles.files : null
    const selectedFile = files?.find((file) => file.path === selectedPath) ?? files?.[0] ?? null

    useEffect(() => {
        if (commitHash === null) return

        let isCurrent = true
        window.api.readCommitFiles(commitHash).then(
            (nextFiles) => {
                if (!isCurrent) return
                setLoadedFiles({ commitHash, files: nextFiles })
                resolveNotifications(NOTIFICATION_SOURCES.commitFiles)
            },
            (error) => {
                if (isCurrent) {
                    raiseNotification('error', errorMessage(error), NOTIFICATION_SOURCES.commitFiles)
                }
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
                if (!isCurrent) return
                setLoadedDiff({ commitHash, path: selectedFile.path, diff })
                resolveNotifications(NOTIFICATION_SOURCES.commitDiff)
            },
            (error) => {
                if (isCurrent) {
                    raiseNotification('error', errorMessage(error), NOTIFICATION_SOURCES.commitDiff)
                }
            }
        )
        return () => {
            isCurrent = false
        }
    }, [commitHash, selectedFile, largeDiffKey])

    const isDiffCurrent =
        loadedDiff !== null && loadedDiff.commitHash === commitHash && loadedDiff.path === selectedFile?.path

    return {
        files,
        selectedFile,
        diff: isDiffCurrent ? loadedDiff.diff : null,
        selectFile: setSelectedPath,
        showLargeDiff: () =>
            setLargeDiffKey(selectedFile === null ? null : `${commitHash}:${selectedFile.path}`)
    }
}
