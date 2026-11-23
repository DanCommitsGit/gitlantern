import {
    BrowserWindow,
    clipboard,
    dialog,
    ipcMain,
    type IpcMainInvokeEvent,
    type OpenDialogOptions
} from 'electron'
import { basename } from 'node:path'
import { IPC_CHANNELS } from '../shared/gitlantern-api'
import {
    requireBoolean,
    requireCommitHash,
    requireCount,
    requireFileChange,
    requireLogScope,
    requireNonEmptyStrings,
    requireNotice,
    requirePullMode,
    requireString,
    requireStrings
} from './ipc-validation'
import { logError, showLogFile } from './log'
import type { Notices } from './notices'
import type { RepositorySession } from './repository-session'
import { readSettings, saveSetting, type SettingsStore } from './settings'
import type { Updater } from './updater'
import { isSameOrigin } from './url-policy'

export function registerIpcHandlers(
    session: RepositorySession,
    settingsStore: SettingsStore,
    updater: Updater,
    notices: Notices,
    rendererUrl: string
): void {
    function handle(channel: string, handler: (...values: unknown[]) => unknown): void {
        ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...values: unknown[]) => {
            try {
                const origin = event.senderFrame?.origin
                if (origin === undefined || !isSameOrigin(origin, rendererUrl)) {
                    throw new Error('Rejected a message from another origin')
                }
                return await handler(...values)
            } catch (error) {
                // The arguments can hold names, emails, paths and commit messages, so they stay out of the log.
                logError(`${channel} failed`, error)
                throw error
            }
        })
    }

    async function choosePath(options: OpenDialogOptions): Promise<string | null> {
        const window = BrowserWindow.getFocusedWindow()
        const { canceled, filePaths } = window
            ? await dialog.showOpenDialog(window, options)
            : await dialog.showOpenDialog(options)
        return canceled ? null : filePaths[0]
    }

    handle(IPC_CHANNELS.checkGit, () => session.checkGit())
    handle(IPC_CHANNELS.chooseGitLocation, async () => {
        const gitPath = await choosePath({ properties: ['openFile'] })
        return gitPath === null ? session.checkGit() : session.useGitLocation(gitPath)
    })
    handle(IPC_CHANNELS.recentRepositories, () =>
        session.recentRepositories().map((path) => ({ path, name: basename(path) }))
    )
    handle(IPC_CHANNELS.chooseFolder, () => choosePath({ properties: ['openDirectory', 'createDirectory'] }))
    handle(IPC_CHANNELS.openRepository, (folder) => session.open(requireString(folder)))
    handle(IPC_CHANNELS.openStartupRepository, () =>
        settingsStore.get('startupPlace') === 'last-repository' ? session.openLastRepository() : null
    )
    handle(IPC_CHANNELS.trustPendingRepository, () => session.trustPending())
    handle(IPC_CHANNELS.createRepository, (folder) => session.create(requireString(folder)))
    handle(IPC_CHANNELS.closeRepository, () => session.close())
    handle(IPC_CHANNELS.readStatus, () => session.readStatus())
    handle(IPC_CHANNELS.readBranches, () => session.readBranches())
    handle(IPC_CHANNELS.saveCollapsedBranchGroups, (groups) =>
        session.saveCollapsedBranchGroups(requireStrings(groups))
    )
    handle(IPC_CHANNELS.readDiff, (change, staged, showLarge) =>
        session.readDiff(requireFileChange(change), requireBoolean(staged), requireBoolean(showLarge))
    )
    handle(IPC_CHANNELS.readCommitLog, (scope, search, skip) =>
        session.readCommitLog(requireLogScope(scope), requireString(search), requireCount(skip))
    )
    handle(IPC_CHANNELS.readCommitFiles, (commitHash) =>
        session.readCommitFiles(requireCommitHash(commitHash))
    )
    handle(IPC_CHANNELS.readCommitDiff, (commitHash, change, showLarge) =>
        session.readCommitDiff(
            requireCommitHash(commitHash),
            requireFileChange(change),
            requireBoolean(showLarge)
        )
    )
    handle(IPC_CHANNELS.stageFiles, (paths) => session.stageFiles(requireNonEmptyStrings(paths)))
    handle(IPC_CHANNELS.stageAll, () => session.stageAll())
    handle(IPC_CHANNELS.unstageFiles, (paths) => session.unstageFiles(requireNonEmptyStrings(paths)))
    handle(IPC_CHANNELS.unstageAll, () => session.unstageAll())
    handle(IPC_CHANNELS.commit, (summary, description) =>
        session.commit(requireString(summary), requireString(description))
    )
    handle(IPC_CHANNELS.fetch, () => session.fetch())
    handle(IPC_CHANNELS.pull, (mode) => session.pull(requirePullMode(mode)))
    handle(IPC_CHANNELS.push, () => session.push())
    handle(IPC_CHANNELS.saveIdentity, (name, email) =>
        session.saveIdentity(requireString(name), requireString(email))
    )
    handle(IPC_CHANNELS.copyText, (text) => clipboard.writeText(requireString(text)))
    handle(IPC_CHANNELS.readSettings, () => readSettings(settingsStore))
    handle(IPC_CHANNELS.saveSetting, (key, value) => saveSetting(settingsStore, key, value))
    handle(IPC_CHANNELS.showLogs, showLogFile)
    handle(IPC_CHANNELS.readUpdateStatus, () => updater.status())
    handle(IPC_CHANNELS.checkForUpdates, () => updater.check())
    handle(IPC_CHANNELS.downloadUpdate, () => updater.download())
    handle(IPC_CHANNELS.installUpdate, () => updater.install())
    handle(IPC_CHANNELS.readNotices, () => notices.list())
    handle(IPC_CHANNELS.dismissNotice, (notice) => notices.dismiss(requireNotice(notice)))
}
