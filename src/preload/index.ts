import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS, type GitlanternApi } from '../shared/gitlantern-api'
import type { Notification } from '../shared/notifications'
import type { UpdateStatus } from '../shared/update-types'

const api: GitlanternApi = {
    platform: process.platform,
    checkGit: () => ipcRenderer.invoke(IPC_CHANNELS.checkGit),
    chooseGitLocation: () => ipcRenderer.invoke(IPC_CHANNELS.chooseGitLocation),
    recentRepositories: () => ipcRenderer.invoke(IPC_CHANNELS.recentRepositories),
    chooseFolder: () => ipcRenderer.invoke(IPC_CHANNELS.chooseFolder),
    openRepository: (folder) => ipcRenderer.invoke(IPC_CHANNELS.openRepository, folder),
    openStartupRepository: () => ipcRenderer.invoke(IPC_CHANNELS.openStartupRepository),
    trustPendingRepository: () => ipcRenderer.invoke(IPC_CHANNELS.trustPendingRepository),
    createRepository: (folder) => ipcRenderer.invoke(IPC_CHANNELS.createRepository, folder),
    cloneRepository: (url, parentFolder) =>
        ipcRenderer.invoke(IPC_CHANNELS.cloneRepository, url, parentFolder),
    cancelClone: () => ipcRenderer.invoke(IPC_CHANNELS.cancelClone),
    onCloneProgress: (listener) => {
        const forward = (_event: IpcRendererEvent, line: string): void => listener(line)
        ipcRenderer.on(IPC_CHANNELS.cloneProgressChanged, forward)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.cloneProgressChanged, forward)
    },
    closeRepository: () => ipcRenderer.invoke(IPC_CHANNELS.closeRepository),
    readStatus: () => ipcRenderer.invoke(IPC_CHANNELS.readStatus),
    readBranches: () => ipcRenderer.invoke(IPC_CHANNELS.readBranches),
    saveCollapsedBranchGroups: (groups) => ipcRenderer.invoke(IPC_CHANNELS.saveCollapsedBranchGroups, groups),
    readDiff: (change, staged, showLarge) =>
        ipcRenderer.invoke(IPC_CHANNELS.readDiff, change, staged, showLarge),
    readCommitLog: (scope, search, skip) =>
        ipcRenderer.invoke(IPC_CHANNELS.readCommitLog, scope, search, skip),
    readCommitFiles: (commitHash) => ipcRenderer.invoke(IPC_CHANNELS.readCommitFiles, commitHash),
    readCommitDiff: (commitHash, change, showLarge) =>
        ipcRenderer.invoke(IPC_CHANNELS.readCommitDiff, commitHash, change, showLarge),
    stageFiles: (paths) => ipcRenderer.invoke(IPC_CHANNELS.stageFiles, paths),
    stageAll: () => ipcRenderer.invoke(IPC_CHANNELS.stageAll),
    unstageFiles: (paths) => ipcRenderer.invoke(IPC_CHANNELS.unstageFiles, paths),
    unstageAll: () => ipcRenderer.invoke(IPC_CHANNELS.unstageAll),
    commit: (summary, description) => ipcRenderer.invoke(IPC_CHANNELS.commit, summary, description),
    fetch: () => ipcRenderer.invoke(IPC_CHANNELS.fetch),
    pull: (mode) => ipcRenderer.invoke(IPC_CHANNELS.pull, mode),
    push: () => ipcRenderer.invoke(IPC_CHANNELS.push),
    saveIdentity: (name, email) => ipcRenderer.invoke(IPC_CHANNELS.saveIdentity, name, email),
    copyText: (text) => ipcRenderer.invoke(IPC_CHANNELS.copyText, text),
    setDialogOpen: (open) => ipcRenderer.invoke(IPC_CHANNELS.setDialogOpen, open),
    readSettings: () => ipcRenderer.invoke(IPC_CHANNELS.readSettings),
    saveSetting: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.saveSetting, key, value),
    showLogs: () => ipcRenderer.invoke(IPC_CHANNELS.showLogs),
    logWindowError: (description) => ipcRenderer.invoke(IPC_CHANNELS.logWindowError, description),
    readUpdateStatus: () => ipcRenderer.invoke(IPC_CHANNELS.readUpdateStatus),
    checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.checkForUpdates),
    downloadUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.downloadUpdate),
    installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.installUpdate),
    onUpdateStatus: (listener) => {
        const forward = (_event: IpcRendererEvent, status: UpdateStatus): void => listener(status)
        ipcRenderer.on(IPC_CHANNELS.updateStatusChanged, forward)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.updateStatusChanged, forward)
    },
    readNotifications: () => ipcRenderer.invoke(IPC_CHANNELS.readNotifications),
    raiseNotification: (severity, message, source) =>
        ipcRenderer.invoke(IPC_CHANNELS.raiseNotification, severity, message, source),
    resolveNotifications: (source) => ipcRenderer.invoke(IPC_CHANNELS.resolveNotifications, source),
    dismissNotification: (id) => ipcRenderer.invoke(IPC_CHANNELS.dismissNotification, id),
    dismissNotificationBanner: (id) => ipcRenderer.invoke(IPC_CHANNELS.dismissNotificationBanner, id),
    dismissAllNotifications: () => ipcRenderer.invoke(IPC_CHANNELS.dismissAllNotifications),
    onNotifications: (listener) => {
        const forward = (_event: IpcRendererEvent, notifications: Notification[]): void =>
            listener(notifications)
        ipcRenderer.on(IPC_CHANNELS.notificationsChanged, forward)
        return () => ipcRenderer.removeListener(IPC_CHANNELS.notificationsChanged, forward)
    }
}

contextBridge.exposeInMainWorld('api', api)
