import { contextBridge, ipcRenderer } from 'electron'

const api = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  ping: (): void => ipcRenderer.send('ping')
}

contextBridge.exposeInMainWorld('api', api)
