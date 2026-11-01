export interface PreloadApi {
  versions: {
    electron: string
    chrome: string
    node: string
  }
  ping: () => void
}

declare global {
  interface Window {
    api: PreloadApi
  }
}
