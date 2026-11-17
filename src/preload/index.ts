import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS, type GitlanternApi } from '../shared/gitlantern-api'
import type { UpdateStatus } from '../shared/update-types'

const api: GitlanternApi = {
  platform: process.platform,
  checkGit: () => ipcRenderer.invoke(IPC_CHANNELS.checkGit),
  chooseGitLocation: () => ipcRenderer.invoke(IPC_CHANNELS.chooseGitLocation),
  recentRepositories: () => ipcRenderer.invoke(IPC_CHANNELS.recentRepositories),
  chooseFolder: () => ipcRenderer.invoke(IPC_CHANNELS.chooseFolder),
  openRepository: (folder) => ipcRenderer.invoke(IPC_CHANNELS.openRepository, folder),
  trustPendingRepository: () => ipcRenderer.invoke(IPC_CHANNELS.trustPendingRepository),
  createRepository: (folder) => ipcRenderer.invoke(IPC_CHANNELS.createRepository, folder),
  closeRepository: () => ipcRenderer.invoke(IPC_CHANNELS.closeRepository),
  readStatus: () => ipcRenderer.invoke(IPC_CHANNELS.readStatus),
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
  saveIdentity: (name, email) => ipcRenderer.invoke(IPC_CHANNELS.saveIdentity, name, email),
  copyText: (text) => ipcRenderer.invoke(IPC_CHANNELS.copyText, text),
  readSettings: () => ipcRenderer.invoke(IPC_CHANNELS.readSettings),
  saveSetting: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.saveSetting, key, value),
  showLogs: () => ipcRenderer.invoke(IPC_CHANNELS.showLogs),
  readUpdateStatus: () => ipcRenderer.invoke(IPC_CHANNELS.readUpdateStatus),
  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.checkForUpdates),
  downloadUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.downloadUpdate),
  installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.installUpdate),
  onUpdateStatus: (listener) => {
    const forward = (_event: IpcRendererEvent, status: UpdateStatus): void => listener(status)
    ipcRenderer.on(IPC_CHANNELS.updateStatusChanged, forward)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.updateStatusChanged, forward)
  }
}

contextBridge.exposeInMainWorld('api', api)
