import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type GitlanternApi } from '../shared/gitlantern-api'

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
  stageFiles: (paths) => ipcRenderer.invoke(IPC_CHANNELS.stageFiles, paths),
  stageAll: () => ipcRenderer.invoke(IPC_CHANNELS.stageAll),
  unstageFiles: (paths) => ipcRenderer.invoke(IPC_CHANNELS.unstageFiles, paths),
  unstageAll: () => ipcRenderer.invoke(IPC_CHANNELS.unstageAll),
  commit: (summary, description) => ipcRenderer.invoke(IPC_CHANNELS.commit, summary, description),
  saveIdentity: (name, email) => ipcRenderer.invoke(IPC_CHANNELS.saveIdentity, name, email),
  copyText: (text) => ipcRenderer.invoke(IPC_CHANNELS.copyText, text)
}

contextBridge.exposeInMainWorld('api', api)
